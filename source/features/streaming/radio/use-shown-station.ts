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
 * The station an open schedule shows: the one it opened on, kept while it is
 * open even if the player moves to another, so a show open in it never pairs
 * with the next station. It closes once that station is switched off. While
 * closed it follows the player, so it opens on the station shown.
 */
export function useScheduleStation({
	open,
	shownStationId,
	stationOn,
	close,
}: {
	open: boolean
	shownStationId: StationId
	stationOn: (stationId: StationId) => boolean
	close: () => void
}): StationId {
	let [held, setHeld] = React.useState(shownStationId)
	if (!open && held !== shownStationId) {
		setHeld(shownStationId)
	}
	let stationId = open ? held : shownStationId
	let switchedOff = open && !stationOn(stationId)
	React.useEffect(() => {
		if (switchedOff) close()
	}, [switchedOff, close])
	return stationId
}
