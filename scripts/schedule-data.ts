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
	SingleBuildingScheduleType,
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

type AuthoredPolicy = {policy: string | Schedule<NamedBuildingScheduleType>; path: string}

/** The calendar's templates and break defaults, and each space's break schedules, with their authored paths. */
function breakPolicies({calendar, spaces}: ScheduleData, calendarLabel: string): AuthoredPolicy[] {
	let policies: AuthoredPolicy[] = []
	for (let [name, policy] of Object.entries(calendar.templates ?? {})) {
		policies.push({policy, path: `${calendarLabel}.templates.${name}`})
	}
	for (let [key, entry] of Object.entries(calendar.breaks)) {
		let path = `${calendarLabel}.breaks.${key}`
		if (entry.defaultSpaceSchedule !== undefined) {
			policies.push({policy: entry.defaultSpaceSchedule, path: `${path}.defaultSpaceSchedule`})
		}
		for (let [name, policy] of Object.entries(entry.templates ?? {})) {
			policies.push({policy, path: `${path}.templates.${name}`})
		}
	}
	for (let {label, data} of spaces) {
		for (let [key, policy] of Object.entries(data.breakSchedule ?? {})) {
			if (policy !== undefined) policies.push({policy, path: `${label}.breakSchedule.${key}`})
		}
	}
	return policies
}

/** A policy's services, and each of its exceptions', with their authored paths; none for a reference. */
function servicesOf({policy, path}: AuthoredPolicy) {
	if (typeof policy === 'string') return []
	return [
		{schedule: policy.schedule, path: `${path}.schedule`},
		...policy.exceptions.map(({schedule}, index) => ({
			schedule,
			path: `${path}.exceptions[${index}].schedule`,
		})),
	]
}

/** Only named break closure messages omit a final period; other notes retain their punctuation. */
function validateBreakMessages(data: ScheduleData, calendarLabel: string): void {
	let messages = new Set(Object.values(data.calendar.breaks).map(({name}) => `Closed for ${name}`))
	for (let {schedule, path} of breakPolicies(data, calendarLabel).flatMap(servicesOf)) {
		for (let [index, {notes}] of schedule.entries()) {
			if (notes && /\.\s*$/u.test(notes) && messages.has(notes.trim().replace(/\.+$/u, ''))) {
				throw new Error(
					`${path}[${index}].notes: break closure messages must not end with a period`,
				)
			}
		}
	}
}

/** Minutes after midnight of a clock time the schema has checked, like `7:30am`. */
function minutesOf(time: string): number {
	let [, hour, minute, half] = /^(\d{1,2}):(\d{2})(am|pm)$/u.exec(time) ?? []
	return (Number(hour) % 12) * 60 + Number(minute) + (half === 'pm' ? 12 * 60 : 0)
}

/** A row's minutes from midnight of its day, a close before the opening running past midnight. */
function spanOf({from, to}: SingleBuildingScheduleType): [number, number] {
	let open = minutesOf(from)
	let close = minutesOf(to)
	return [open, close < open ? close + 24 * 60 : close]
}

/**
 * Two rows of one service whose hours overlap on a day they share say two
 * things about that day; rows that only meet, as split hours do, are fine.
 */
function validateRowOverlaps(data: ScheduleData, calendarLabel: string): void {
	let policies = [
		...breakPolicies(data, calendarLabel),
		...data.spaces.map(({label, data}) => ({policy: data, path: label})),
	]
	for (let {schedule, path} of policies.flatMap(servicesOf)) {
		for (let [service, {hours}] of schedule.entries()) {
			for (let [later, row] of hours.entries()) {
				for (let [earlier, other] of hours.slice(0, later).entries()) {
					let shared = row.days.filter((day) => other.days.includes(day))
					let [open, close] = spanOf(row)
					let [otherOpen, otherClose] = spanOf(other)
					if (shared.length > 0 && open < otherClose && otherOpen < close) {
						throw new Error(
							`${path}[${service}].hours[${later}]: overlaps hours[${earlier}] on ${shared.join(', ')}`,
						)
					}
				}
			}
		}
	}
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
	validateBreakMessages({calendar, spaces}, calendarInput.label)
	validateRowOverlaps({calendar, spaces}, calendarInput.label)
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

/**
 * The order the hours files are published in, which the phone app lists them
 * in: by name, counting a numbered prefix as a number, so `10-` follows `8-`.
 */
export const hoursFileOrder = new Intl.Collator(undefined, {numeric: true}).compare

/** Reads a consistently ordered pair, applies any selection, then prepares it for publication. */
export function loadScheduleData(fromDir: string, selection?: ScheduleSelection): ScheduleData {
	let hoursDir = join(fromDir, 'building-hours')
	let files = readdirSync(hoursDir).filter(isDataEntry)
	files.sort(hoursFileOrder)
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
