import {STATION_LIST, type Station, type StationId} from '../stations'
import type {FollowedShow} from '../store'

/**
 * The followed shows under each station with any, in the player's station
 * order, leaving out a station that is switched off.
 */
export function remindersByStation(
	follows: readonly FollowedShow[],
	stationOn: (stationId: StationId) => boolean,
): Array<{station: Station; shows: FollowedShow[]}> {
	return STATION_LIST.filter((station) => stationOn(station.id)).flatMap((station) => {
		let shows = follows.filter((show) => show.stationId === station.id)
		return shows.length > 0 ? [{station, shows}] : []
	})
}

/**
 * The followed shows to remind of: those on stations that are switched on. A
 * switched-off station's shows stay followed, so their reminders return with it.
 */
export function followsToRemind(
	follows: readonly FollowedShow[],
	stationOn: (stationId: StationId) => boolean,
): FollowedShow[] {
	return follows.filter((show) => stationOn(show.stationId))
}
