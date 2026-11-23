import {useOfferedStations} from './station-flags'
import {stationToShow, type StationId} from './stations'
import {useRadioStore} from './store'

/** The station the player shows, which is always one that is offered while any is. */
export function useShownStationId(): StationId {
	let viewed = useRadioStore((state) => state.viewedStationId)
	return stationToShow(viewed, useOfferedStations())
}
