import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import Ajv from 'ajv'
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

/** Validated schedules retain every field and unresolved reference. */
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

/**
 * Parses paired inputs, normalizes schedules and validates the complete reference graph.
 * No output is written and no date-dependent selection or reference resolution occurs.
 */
export function parseScheduleData(
	calendarInput: ScheduleDataInput,
	spaceInputs: readonly ScheduleDataInput[],
): ScheduleData {
	validators ??= createValidators()
	let {ajv, calendar: validateCalendar, space: validateSpace} = validators
	if (!validateCalendar(calendarInput.data)) {
		throw new Error(
			ajv.errorsText(validateCalendar.errors, {dataVar: calendarInput.label, separator: '; '}),
		)
	}
	let {breaks, templates, ...calendarFields} = calendarInput.data
	let calendar: ScheduleData['calendar'] = {
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
	let spaces: ScheduleData['spaces'] = spaceInputs.map(({label, data}) => {
		if (!validateSpace(data)) {
			throw new Error(ajv.errorsText(validateSpace.errors, {dataVar: label, separator: '; '}))
		}
		let {breakSchedule, ...fields} = data
		return {
			label,
			data: {
				...fields,
				exceptions: fields.exceptions ?? [],
				...(breakSchedule !== undefined
					? {
							breakSchedule: Object.fromEntries(
								Object.entries(breakSchedule).map(([key, value]) => [key, normalizeEntry(value)]),
							),
						}
					: {}),
			},
		}
	})
	validateSchedules(
		calendar,
		spaces.map(({label, data}) => ({label, schedules: data})),
		calendarInput.label,
	)
	return {calendar, spaces}
}

/** Retains the filename in both YAML syntax errors and validation errors. */
function readInput(filename: string): ScheduleDataInput {
	return {label: filename, data: load(readFileSync(filename, 'utf8'), {filename})}
}

/** Reads and validates the complete calendar and hours before generation starts. */
export function loadScheduleData(fromDir: string): ScheduleData {
	let hoursDir = join(fromDir, 'building-hours')
	let files = readdirSync(hoursDir).filter(isDataEntry)
	files.sort(new Intl.Collator(undefined, {numeric: true}).compare)
	return parseScheduleData(
		readInput(join(fromDir, 'breaks.yaml')),
		files.map((file) => readInput(join(hoursDir, file))),
	)
}
