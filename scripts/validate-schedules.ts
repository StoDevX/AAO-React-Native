import {normalizeCalendarInterval} from '../modules/schedules/index.ts'
import type {
	BreakCalendar,
	CalendarInterval,
	Schedule,
	Schedules,
} from '../modules/schedules/index.ts'

/** Supplies an author-facing label without tying validation to files or buildings. */
export type ScheduleValidationInput<T> = {
	label: string
	schedules: Schedules<T, string | Schedule<T>> & {name?: string}
}

type ValidationContext<T> = {
	calendar: BreakCalendar<T>
	calendarLabel: string
	breakKeys: Set<string>
}

const RESERVED_NAMES = new Set(['normal', 'inherit'])

/** Reports the location of invalid authored data. */
function fail(path: string, message: string): never {
	throw new Error(`${path}: ${message}`)
}

/**
 * Checks calendar, exception dates, namespaces and reference graphs after structural
 * validation. Service payloads remain generic; references are checked without
 * resolving or merging schedules, and validation is independent of today's date.
 */
export function validateSchedules<T>(
	calendar: BreakCalendar<T>,
	spaces: readonly ScheduleValidationInput<T>[],
	calendarLabel = 'calendar',
): void {
	// A calendar with no breaks still needs a usable timezone.
	normalizeInterval({date: '2000-01-01'}, calendar.timezone, `${calendarLabel}.timezone`)
	let context = {calendar, calendarLabel, breakKeys: new Set(Object.keys(calendar.breaks))}
	validateNamespaces(context)
	validateBreakIntervals(context)
	validateCalendarPolicies(context)
	validateSpaces(context, spaces)
}

/** Adds the authored location to calendar normalization errors. */
function normalizeInterval(interval: CalendarInterval, timezone: string, path: string) {
	try {
		return normalizeCalendarInterval(interval, timezone)
	} catch (error) {
		return fail(path, error instanceof Error ? error.message : String(error))
	}
}

function validateNamespaces<T>({calendar, calendarLabel, breakKeys}: ValidationContext<T>): void {
	let templateKeys = new Set(Object.keys(calendar.templates ?? {}))
	for (let entry of Object.values(calendar.breaks)) {
		for (let key of Object.keys(entry.templates ?? {})) templateKeys.add(key)
	}
	for (let key of breakKeys) {
		if (RESERVED_NAMES.has(key)) fail(`${calendarLabel}.breaks.${key}`, 'reserved name')
		if (templateKeys.has(key)) {
			fail(`${calendarLabel}.breaks.${key}`, 'break and template names must be disjoint')
		}
	}
	for (let key of templateKeys) {
		if (RESERVED_NAMES.has(key)) fail(`${calendarLabel}.templates.${key}`, 'reserved name')
	}
}

function validateBreakIntervals<T>({calendar, calendarLabel}: ValidationContext<T>): void {
	let intervals = Object.entries(calendar.breaks).map(([key, entry]) => ({
		key,
		...normalizeInterval(entry, calendar.timezone, `${calendarLabel}.breaks.${key}`),
	}))
	for (let [index, first] of intervals.entries()) {
		for (let second of intervals.slice(index + 1)) {
			if (first.startMs === second.startMs && first.endMs === second.endMs) {
				fail(`${calendarLabel}.breaks.${second.key}`, `duplicates the interval of ${first.key}`)
			}
			let overlaps = first.startMs < second.endMs && second.startMs < first.endMs
			let nested =
				(first.startMs <= second.startMs && first.endMs >= second.endMs) ||
				(second.startMs <= first.startMs && second.endMs >= first.endMs)
			if (overlaps && !nested) {
				fail(`${calendarLabel}.breaks.${second.key}`, `partially overlaps ${first.key}`)
			}
		}
	}
}

function validateSchedule<T>(policy: Schedule<T>, timezone: string, path: string): void {
	let {schedule, exceptions} = policy
	if (schedule.length === 0) {
		fail(`${path}.schedule`, 'a schedule must contain at least one service')
	}
	let dates = new Set<string>()
	for (let [index, exception] of exceptions.entries()) {
		let exceptionPath = `${path}.exceptions[${index}]`
		normalizeInterval({date: exception.date}, timezone, `${exceptionPath}.date`)
		if (dates.has(exception.date)) {
			fail(exceptionPath, `duplicate exception date ${exception.date}`)
		}
		dates.add(exception.date)
		if (exception.schedule.length === 0) {
			fail(`${exceptionPath}.schedule`, 'a replacement must contain at least one service')
		}
	}
}

function hasTemplate<T>(calendar: BreakCalendar<T>, key: string, name: string): boolean {
	return (
		Object.hasOwn(calendar.breaks[key].templates ?? {}, name) ||
		Object.hasOwn(calendar.templates ?? {}, name)
	)
}

function validateCalendarPolicies<T>({
	calendar,
	calendarLabel,
	breakKeys,
}: ValidationContext<T>): void {
	for (let [name, policy] of Object.entries(calendar.templates ?? {})) {
		validateSchedule(policy, calendar.timezone, `${calendarLabel}.templates.${name}`)
	}
	for (let [key, entry] of Object.entries(calendar.breaks)) {
		let path = `${calendarLabel}.breaks.${key}`
		for (let [name, policy] of Object.entries(entry.templates ?? {})) {
			validateSchedule(policy, calendar.timezone, `${path}.templates.${name}`)
		}
		let defaultPolicy = entry.defaultSpaceSchedule
		if (typeof defaultPolicy === 'string') {
			if (RESERVED_NAMES.has(defaultPolicy) || breakKeys.has(defaultPolicy)) {
				fail(
					`${path}.defaultSpaceSchedule`,
					'defaults cannot use normal, inherit or break references',
				)
			}
			if (!hasTemplate(calendar, key, defaultPolicy)) {
				fail(`${path}.defaultSpaceSchedule`, `unknown template ${defaultPolicy}`)
			}
		} else if (defaultPolicy !== undefined) {
			validateSchedule(defaultPolicy, calendar.timezone, `${path}.defaultSpaceSchedule`)
		}
	}
}

function validateSpaces<T>(
	context: ValidationContext<T>,
	spaces: readonly ScheduleValidationInput<T>[],
): void {
	let {calendar} = context
	let names = new Map<string, string>()
	for (let {label, schedules} of spaces) {
		validateSpaceName(schedules.name, label, names)
		validateSchedule(
			{schedule: schedules.schedule, exceptions: schedules.exceptions ?? []},
			calendar.timezone,
			label,
		)
		validateSpaceReferences(context, schedules.breakSchedule ?? {}, label)
	}
}

function validateSpaceName(
	name: string | undefined,
	label: string,
	names: Map<string, string>,
): void {
	if (name !== undefined) {
		let previous = names.get(name)
		if (previous !== undefined) {
			fail(`${label}.name`, `duplicate space name ${name}; first defined at ${previous}.name`)
		}
		names.set(name, label)
	}
}

function validateSpaceReferences<T>(
	{calendar, breakKeys}: ValidationContext<T>,
	entries: NonNullable<Schedules<T, string | Schedule<T>>['breakSchedule']>,
	label: string,
): void {
	for (let key of Object.keys(entries)) {
		if (!breakKeys.has(key)) fail(`${label}.breakSchedule.${key}`, 'unknown break key')
	}
	let visiting = new Set<string>()
	let visited = new Set<string>()
	let visit = (key: string, trail: string[]) => {
		let path = `${label}.breakSchedule.${key}`
		if (visiting.has(key)) fail(path, `cyclic break reference: ${[...trail, key].join(' -> ')}`)
		if (visited.has(key)) return
		if (!Object.hasOwn(entries, key) || entries[key] === undefined) {
			fail(path, 'missing authored alias target')
		}
		visiting.add(key)
		let policy = entries[key]
		if (typeof policy !== 'string') {
			validateSchedule(policy, calendar.timezone, path)
		} else if (policy === 'inherit') {
			if (calendar.breaks[key].defaultSpaceSchedule === undefined) {
				fail(path, 'inherit requires a break default')
			}
		} else if (policy !== 'normal') {
			if (breakKeys.has(policy)) {
				if (policy === key) fail(path, 'a break cannot reference itself')
				visit(policy, [...trail, key])
			} else if (!hasTemplate(calendar, key, policy)) {
				fail(path, `unknown template ${policy} in ${key}'s context`)
			}
		}
		visiting.delete(key)
		visited.add(key)
	}
	for (let key of Object.keys(entries)) visit(key, [])
}
