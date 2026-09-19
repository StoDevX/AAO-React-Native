import type {Moment} from 'moment-timezone'
import type {NamedBuildingScheduleType, SingleBuildingScheduleType} from '../types'
import {isScheduleRowActive} from './is-schedule-row-active'
import {summarizeDays} from './summarize-days'

export type ScheduleEntry = {
	schedule: SingleBuildingScheduleType
	isActive: boolean
	/** Original index in schedule.hours, for stable React keys. */
	sourceIndex: number
}

export type GroupedHours = {
	label: string
	entries: ScheduleEntry[]
}

/**
 * Groups schedule hours into runs of adjacent rows with the same day label,
 * and marks each row that is running at `now`.
 * Non-adjacent rows with the same label remain separate groups.
 */
export function groupHoursByDays(schedule: NamedBuildingScheduleType, now: Moment): GroupedHours[] {
	let groups: GroupedHours[] = []
	schedule.hours.forEach((set, i) => {
		let label = summarizeDays(set.days)
		let entry = {schedule: set, isActive: isScheduleRowActive(schedule, set, now), sourceIndex: i}
		let last = groups.at(-1)
		if (last?.label === label) {
			last.entries.push(entry)
		} else {
			groups.push({label, entries: [entry]})
		}
	})
	return groups
}
