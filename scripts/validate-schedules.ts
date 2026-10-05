import {normalizeCalendarInterval} from '../modules/schedules/index.ts'
import type {BreakCalendar, Schedule, Schedules} from '../modules/schedules/index.ts'

/** Supplies an author-facing label without tying validation to files or buildings. */
export type ScheduleValidationInput<T> = {
	label: string
	schedules: Schedules<T, string | Schedule<T>>
}

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
	try {
		normalizeCalendarInterval({date: '2000-01-01'}, calendar.timezone)
	} catch (error) {
		fail(`${calendarLabel}.timezone`, error instanceof Error ? error.message : String(error))
	}
	let breakKeys = new Set(Object.keys(calendar.breaks))
	let reserved = new Set(['normal', 'inherit'])
	let globalTemplates = calendar.templates ?? {}
	let templateKeys = new Set(Object.keys(globalTemplates))
	for (let entry of Object.values(calendar.breaks)) {
		for (let key of Object.keys(entry.templates ?? {})) templateKeys.add(key)
	}
	for (let key of breakKeys) {
		if (reserved.has(key)) fail(`${calendarLabel}.breaks.${key}`, 'reserved name')
		if (templateKeys.has(key)) {
			fail(`${calendarLabel}.breaks.${key}`, 'break and template names must be disjoint')
		}
	}
	for (let key of templateKeys) {
		if (reserved.has(key)) fail(`${calendarLabel}.templates.${key}`, 'reserved name')
	}

	let intervals = Object.entries(calendar.breaks).map(([key, entry]) => {
		try {
			return {key, ...normalizeCalendarInterval(entry, calendar.timezone)}
		} catch (error) {
			return fail(
				`${calendarLabel}.breaks.${key}`,
				error instanceof Error ? error.message : String(error),
			)
		}
	})
	for (let [index, first] of intervals.entries()) {
		for (let second of intervals.slice(index + 1)) {
			if (first.startMs === second.startMs && first.endMs === second.endMs) {
				fail(`${calendarLabel}.breaks.${second.key}`, `duplicates the interval of ${first.key}`)
			}
			if (
				first.calendarDays === second.calendarDays &&
				first.startMs < second.endMs &&
				second.startMs < first.endMs
			) {
				fail(
					`${calendarLabel}.breaks.${second.key}`,
					`overlaps ${first.key} with an equal calendar-day span`,
				)
			}
		}
	}

	let validateSchedule = (policy: Schedule<T>, path: string) => {
		let {schedule, exceptions} = policy
		if (schedule.length === 0) {
			fail(`${path}.schedule`, 'a schedule must contain at least one service')
		}
		let dates = new Set<string>()
		for (let [index, exception] of exceptions.entries()) {
			let exceptionPath = `${path}.exceptions[${index}]`
			try {
				normalizeCalendarInterval({date: exception.date}, calendar.timezone)
			} catch (error) {
				fail(`${exceptionPath}.date`, error instanceof Error ? error.message : String(error))
			}
			if (dates.has(exception.date)) {
				fail(exceptionPath, `duplicate exception date ${exception.date}`)
			}
			dates.add(exception.date)
			if (exception.schedule.length === 0) {
				fail(`${exceptionPath}.schedule`, 'a replacement must contain at least one service')
			}
		}
	}
	let hasTemplate = (key: string, name: string) =>
		Object.hasOwn(calendar.breaks[key].templates ?? {}, name) ||
		Object.hasOwn(globalTemplates, name)
	for (let [name, policy] of Object.entries(globalTemplates)) {
		validateSchedule(policy, `${calendarLabel}.templates.${name}`)
	}
	for (let [key, entry] of Object.entries(calendar.breaks)) {
		let path = `${calendarLabel}.breaks.${key}`
		for (let [name, policy] of Object.entries(entry.templates ?? {})) {
			validateSchedule(policy, `${path}.templates.${name}`)
		}
		let defaultPolicy = entry.defaultSpaceSchedule
		if (typeof defaultPolicy === 'string') {
			if (reserved.has(defaultPolicy) || breakKeys.has(defaultPolicy)) {
				fail(
					`${path}.defaultSpaceSchedule`,
					'defaults cannot use normal, inherit or break references',
				)
			}
			if (!hasTemplate(key, defaultPolicy)) {
				fail(`${path}.defaultSpaceSchedule`, `unknown template ${defaultPolicy}`)
			}
		} else if (defaultPolicy !== undefined) {
			validateSchedule(defaultPolicy, `${path}.defaultSpaceSchedule`)
		}
	}

	for (let {label, schedules} of spaces) {
		validateSchedule({schedule: schedules.schedule, exceptions: schedules.exceptions ?? []}, label)
		let entries = schedules.breakSchedule ?? {}
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
				validateSchedule(policy, path)
			} else if (policy === 'inherit') {
				if (calendar.breaks[key].defaultSpaceSchedule === undefined) {
					fail(path, 'inherit requires a break default')
				}
			} else if (policy !== 'normal') {
				if (breakKeys.has(policy)) {
					if (policy === key) fail(path, 'a break cannot reference itself')
					visit(policy, [...trail, key])
				} else if (!hasTemplate(key, policy)) {
					fail(path, `unknown template ${policy} in ${key}'s context`)
				}
			}
			visiting.delete(key)
			visited.add(key)
		}
		for (let key of Object.keys(entries)) visit(key, [])
	}
}
