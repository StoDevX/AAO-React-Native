import {readFileSync, readdirSync, realpathSync} from 'node:fs'
import {join} from 'node:path'
import Ajv from 'ajv'
import type {ValidateFunction} from 'ajv'
import addFormats from 'ajv-formats'
import {load} from 'js-yaml'
import type {
	BreakCalendar,
	CalendarBreak,
	CalendarInterval,
	Schedule,
} from '../modules/schedules/index.ts'
import type {
	BuildingType,
	NamedBuildingScheduleType,
} from '../source/features/building-hours/types.ts'
import {isDataEntry} from './data-entries.mjs'
import {SCHEMA_BASE} from './paths.mjs'
import {validateSchedules} from './validate-schedules.ts'

/** Labels identify the input in structural and cross-file errors. */
export type ScheduleDataInput = {label: string; data: unknown}

/** Validated schedules retain authored fields and unresolved references. */
export type ScheduleData = {
	calendar: BreakCalendar<NamedBuildingScheduleType>
	spaces: Array<{
		label: string
		data: PublishedSpace
	}>
}

/** Published spaces always carry normalized exceptions and a validated kind. */
type PublishedSpace = BuildingType<string | Schedule<NamedBuildingScheduleType>> &
	Schedule<NamedBuildingScheduleType> & {
		kind: NonNullable<BuildingType['kind']>
	}

/** YAML permits shorthand arrays and omitted exceptions before normalization. */
type ScheduleInput =
	| NamedBuildingScheduleType[]
	| (Pick<Schedule<NamedBuildingScheduleType>, 'schedule'> &
			Partial<Pick<Schedule<NamedBuildingScheduleType>, 'exceptions'>>)

type CalendarInput = Omit<BreakCalendar<NamedBuildingScheduleType>, 'breaks' | 'templates'> & {
	breaks: Record<
		string,
		CalendarInterval &
			Pick<CalendarBreak, 'name'> & {
				defaultSpaceSchedule?: string | ScheduleInput
				templates?: Record<string, ScheduleInput>
			}
	>
	templates?: Record<string, ScheduleInput>
}

type SpaceInput = Omit<BuildingType, 'breakSchedule' | 'kind'> & {
	kind: PublishedSpace['kind']
	breakSchedule?: Record<string, string | ScheduleInput>
}

/** Loads a committed schema without treating arbitrary YAML as a typed payload. */
function readSchema(filename: string): Record<string, unknown> {
	let schema: unknown = load(readFileSync(join(SCHEMA_BASE, filename), 'utf8'))
	if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) {
		throw new Error(`Invalid schema object in ${filename}`)
	}
	return schema as Record<string, unknown>
}

/** All service arrays share one schema, including dated replacements. */
function createValidators() {
	let ajv = new Ajv({allErrors: true})
	addFormats(ajv)
	ajv.addSchema(readSchema('_defs.yaml'))
	ajv.addSchema(readSchema('_schedules.yaml'))
	return {
		ajv,
		calendar: ajv.compile<CalendarInput>(readSchema('breaks.yaml')),
		space: ajv.compile<SpaceInput>(readSchema('building-hours.yaml')),
	}
}

let validators: ReturnType<typeof createValidators> | undefined

/** Converts YAML shorthand into the shared schedule structure without mutating input. */
function normalizeSchedule(input: ScheduleInput): Schedule<NamedBuildingScheduleType> {
	return Array.isArray(input)
		? {schedule: input, exceptions: []}
		: {...input, exceptions: input.exceptions ?? []}
}

/** Keeps references intact for later resolution. */
function normalizeEntry(
	input: string | ScheduleInput,
): string | Schedule<NamedBuildingScheduleType> {
	return typeof input === 'string' ? input : normalizeSchedule(input)
}

/** Templates always contain schedules rather than references. */
function normalizeTemplates(input: Record<string, ScheduleInput>) {
	return Object.fromEntries(
		Object.entries(input).map(([key, value]) => [key, normalizeSchedule(value)]),
	)
}

/** Normalizes each calendar policy while retaining its names and dates. */
function normalizeCalendar(input: CalendarInput): ScheduleData['calendar'] {
	let {breaks, templates, ...calendarFields} = input
	return {
		...calendarFields,
		breaks: Object.fromEntries(
			Object.entries(breaks).map(([key, entry]) => {
				let {defaultSpaceSchedule, templates, ...fields} = entry
				return [
					key,
					{
						...fields,
						...(defaultSpaceSchedule !== undefined
							? {defaultSpaceSchedule: normalizeEntry(defaultSpaceSchedule)}
							: {}),
						...(templates !== undefined ? {templates: normalizeTemplates(templates)} : {}),
					},
				]
			}),
		),
		...(templates !== undefined ? {templates: normalizeTemplates(templates)} : {}),
	}
}

/** Keeps omitted break policies absent and normal exceptions explicit. */
function normalizeSpace(input: SpaceInput): PublishedSpace {
	let {breakSchedule, ...fields} = input
	return {
		...fields,
		exceptions: fields.exceptions ?? [],
		...(breakSchedule !== undefined
			? {
					breakSchedule: Object.fromEntries(
						Object.entries(breakSchedule).map(([key, value]) => [key, normalizeEntry(value)]),
					),
				}
			: {}),
	}
}

/** Checks unknown input once and retains its authored location in errors. */
function validateInput<T>(input: ScheduleDataInput, validate: ValidateFunction<T>, ajv: Ajv): T {
	if (!validate(input.data)) {
		throw new Error(ajv.errorsText(validate.errors, {dataVar: input.label, separator: '; '}))
	}
	return input.data
}

/** Checks structure, normalizes policies, then validates the complete reference graph. */
export function parseScheduleData(
	calendarInput: ScheduleDataInput,
	spaceInputs: readonly ScheduleDataInput[],
): ScheduleData {
	validators ??= createValidators()
	let {ajv, calendar: validateCalendar, space: validateSpace} = validators
	let authoredCalendar = validateInput(calendarInput, validateCalendar, ajv)
	let authoredSpaces = spaceInputs.map((input) => ({
		label: input.label,
		data: validateInput(input, validateSpace, ajv),
	}))
	let calendar = normalizeCalendar(authoredCalendar)
	let spaces = authoredSpaces.map(({label, data}) => ({label, data: normalizeSpace(data)}))
	validateSchedules(
		calendar,
		spaces.map(({label, data}) => ({label, schedules: data})),
		calendarInput.label,
	)
	return {calendar, spaces}
}

/** Constructs both publication envelopes from a fully validated schedule pair. */
export function scheduleArtifacts({
	calendar,
	spaces,
}: ScheduleData): [
	{filename: 'building-hours.json'; data: {data: PublishedSpace[]}},
	{filename: 'breaks.json'; data: {data: ScheduleData['calendar']}},
] {
	return [
		{filename: 'building-hours.json', data: {data: spaces.map(({data}) => data)}},
		{filename: 'breaks.json', data: {data: calendar}},
	]
}

/** Retains the filename in both YAML syntax errors and validation errors. */
function readInput(filename: string): ScheduleDataInput {
	return {label: filename, data: load(readFileSync(filename, 'utf8'), {filename})}
}

/** A selected file replaces its authored input, or adds a new space to the pair. */
type ScheduleSelection = {kind: 'calendar' | 'space'; filename: string}

/** Reads a consistently ordered pair, applies any selection, then prepares it for publication. */
export function loadScheduleData(fromDir: string, selection?: ScheduleSelection): ScheduleData {
	let hoursDir = join(fromDir, 'building-hours')
	let files = readdirSync(hoursDir).filter(isDataEntry)
	files.sort(new Intl.Collator(undefined, {numeric: true}).compare)
	let spaceFiles = files.map((file) => join(hoursDir, file))
	if (selection?.kind === 'space') {
		let selectedPath = realpathSync.native(selection.filename)
		let index = spaceFiles.findIndex((filename) => realpathSync.native(filename) === selectedPath)
		if (index === -1) spaceFiles.push(selection.filename)
		else spaceFiles[index] = selection.filename
	}
	return parseScheduleData(
		readInput(selection?.kind === 'calendar' ? selection.filename : join(fromDir, 'breaks.yaml')),
		spaceFiles.map(readInput),
	)
}
