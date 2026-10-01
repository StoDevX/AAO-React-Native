import type {NamedBuildingScheduleType} from '../types'

/**
 * Whether any of a building's schedule sets lists an hour to show.
 *
 * A building with none is not closed -- it is unscheduled, and a status line
 * reading "Closed" would be a claim the data does not support. The row shows
 * the schedule's note instead.
 */
export function hasDisplayableHours(schedules: NamedBuildingScheduleType[]): boolean {
	return schedules.some((set) => set.hours.length > 0)
}

/** The schedule sets with an hour or a note to show; the rest draw nothing. */
export function schedulesWithContent(
	schedules: NamedBuildingScheduleType[],
): NamedBuildingScheduleType[] {
	return schedules.filter((set) => set.hours.length > 0 || set.notes)
}

/** The note from the first schedule set that carries one, if any does. */
export function firstScheduleNote(schedules: NamedBuildingScheduleType[]): string | undefined {
	return schedules.find((set) => set.notes)?.notes
}
