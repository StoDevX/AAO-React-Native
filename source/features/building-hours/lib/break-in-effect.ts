import moment from 'moment-timezone'
import type {BreakCalendarResponse, ScheduleException} from '@frogpond/schedules'
import type {BuildingType, NamedBuildingScheduleType} from '../types'

type BreakEntry = {
	schedule: NamedBuildingScheduleType[]
	exceptions?: ScheduleException<NamedBuildingScheduleType>[]
}

/** A resolved break entry, as the server sends it; older feeds sent bare arrays. */
function asBreakEntry(entry: unknown): BreakEntry | undefined {
	if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return undefined
	let schedule = (entry as {schedule?: unknown}).schedule
	return Array.isArray(schedule) ? (entry as BreakEntry) : undefined
}

/** Whether any venue carries a resolved break schedule worth a calendar fetch. */
export function hasBreakSchedules(buildings: BuildingType<unknown>[]): boolean {
	return buildings.some((b) => Object.values(b.breakSchedule ?? {}).some(asBreakEntry))
}

/**
 * The breaks under way at `now`, shortest first: on Easter itself, a venue
 * with schedules for both Easter and Spring Break keeps Easter's. Dates are
 * the calendar's own, in its timezone, and include both ends.
 */
export function activeBreaks(calendar: BreakCalendarResponse, now: number): string[] {
	let today = moment.tz(now, calendar.data.timezone).format('YYYY-MM-DD')
	let active: {key: string; length: number}[] = []
	for (let [key, entry] of Object.entries(calendar.data.breaks)) {
		let start = entry.date ?? entry.start
		let end = entry.date ?? entry.end
		if (start === undefined || end === undefined) continue
		if (start <= today && today <= end) {
			active.push({key, length: Date.parse(end) - Date.parse(start)})
		}
	}
	return active.sort((a, b) => a.length - b.length).map(({key}) => key)
}

/**
 * The venues as they stand at `now`: during a break, a venue with a schedule
 * for it shows that schedule and its exceptions as its own. Venues with
 * nothing for the break, and every venue outside one, are returned as they
 * are. It picks breaks by the server's rules (`source/schedules/active.ts` in
 * ccc-server), so a moved clock shows what the server will serve on the day.
 */
export function withBreakInEffect(
	buildings: BuildingType<unknown>[],
	calendar: BreakCalendarResponse | undefined,
	now: number,
): BuildingType<unknown>[] {
	if (!calendar) return buildings
	let active = activeBreaks(calendar, now)
	if (active.length === 0) return buildings
	return buildings.map((building) => {
		let policies = building.breakSchedule ?? {}
		for (let key of active) {
			let entry = Object.hasOwn(policies, key) ? asBreakEntry(policies[key]) : undefined
			if (entry) return {...building, schedule: entry.schedule, exceptions: entry.exceptions ?? []}
		}
		return building
	})
}
