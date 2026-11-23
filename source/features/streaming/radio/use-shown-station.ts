import * as React from 'react'

import {useOfferedStations} from './station-flags'
import {stationToShow, type StationId} from './stations'
import {useRadioStore} from './store'

/** The station the player shows, which is always one that is offered while any is. */
export function useShownStationId(): StationId {
	let viewed = useRadioStore((state) => state.viewedStationId)
	return stationToShow(viewed, useOfferedStations())
}

/**
 * Closes a station's open schedule when the station it shows changes, which
 * only a switch-off does while it is open: the schedule, and any show open in
 * it, would otherwise turn into the next station's.
 */
export function useClosesOnStationChange(
	open: boolean,
	stationId: StationId,
	close: () => void,
): void {
	let previous = React.useRef(stationId)
	React.useEffect(() => {
		if (open && previous.current !== stationId) close()
		previous.current = stationId
	}, [open, stationId, close])
}
