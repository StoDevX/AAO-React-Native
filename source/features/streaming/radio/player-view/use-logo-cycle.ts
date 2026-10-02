import {useState} from 'react'

import type {Station, StationId} from '../stations'
import type {RadioLogo} from '../theme'

/**
 * The station's logo on show, and how to move to the next. Always the first
 * logo on arrival, and again whenever the station changes: an index from one
 * station's logos means nothing among another's.
 */
export function useLogoCycle(station: Station): {logo: RadioLogo; showNextLogo?: () => void} {
	let {logos} = station
	let [shown, setShown] = useState<{stationId: StationId; index: number}>({
		stationId: station.id,
		index: 0,
	})
	let index = shown.stationId === station.id ? shown.index : 0
	let showNextLogo =
		logos.length > 1
			? () => setShown({stationId: station.id, index: (index + 1) % logos.length})
			: undefined
	return {logo: logos[index], showNextLogo}
}
