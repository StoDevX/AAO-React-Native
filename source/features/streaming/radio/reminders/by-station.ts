import {STATION_LIST, type Station} from '../stations'
import type {FollowedShow} from '../store'

/** The followed shows under each station with any, in the player's station order. */
export function remindersByStation(
	follows: readonly FollowedShow[],
): Array<{station: Station; shows: FollowedShow[]}> {
	return STATION_LIST.flatMap((station) => {
		let shows = follows.filter((show) => show.stationId === station.id)
		return shows.length > 0 ? [{station, shows}] : []
	})
}
