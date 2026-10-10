import {CAMPUSES, type CampusDefinition} from '../../campuses'
import type {ScheduleEntry} from './campus-section'

/** The schedule `id` names among `campus`'s, or undefined if the campus doesn't list it. */
export function scheduleEntry(campus: CampusDefinition, id: string): ScheduleEntry | undefined {
	return campus.schedules?.entries.find((entry) => entry.id === id)
}

/**
 * The schedule `id` names on whichever campus lists it. Ids are unique across
 * campuses, and the radio player offers every campus's stations on every campus.
 */
export function anyScheduleEntry(id: string): ScheduleEntry | undefined {
	for (let campus of CAMPUSES) {
		let entry = scheduleEntry(campus, id)
		if (entry) {
			return entry
		}
	}
	return undefined
}
