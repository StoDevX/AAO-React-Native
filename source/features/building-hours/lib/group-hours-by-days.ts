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
	/** Index of the first entry in the original hours array. */
	startIndex: number
}

/**
 * Groups schedule hours into runs of adjacent rows with the same day label.
 * Non-adjacent rows with the same label remain separate groups.
 */
export function groupHoursByDays(schedule: NamedBuildingScheduleType, now: Moment): GroupedHours[] {
	let groups: GroupedHours[] = []
	let currentLabel: string | null = null
	let currentGroup: ScheduleEntry[] = []
	let groupStartIndex = 0

	for (let i = 0; i < schedule.hours.length; i++) {
		let set = schedule.hours[i]
		let label = summarizeDays(set.days)
		let entry: ScheduleEntry = {
			schedule: set,
			isActive: isScheduleRowActive(schedule, set, now),
			sourceIndex: i,
		}

		if (label === currentLabel) {
			currentGroup.push(entry)
		} else {
			if (currentGroup.length > 0 && currentLabel !== null) {
				groups.push({label: currentLabel, entries: currentGroup, startIndex: groupStartIndex})
			}
			currentLabel = label
			currentGroup = [entry]
			groupStartIndex = i
		}
	}

	if (currentGroup.length > 0 && currentLabel !== null) {
		groups.push({label: currentLabel, entries: currentGroup, startIndex: groupStartIndex})
	}

	return groups
}
