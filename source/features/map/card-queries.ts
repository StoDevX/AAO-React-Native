import {campusById, type CampusId} from '../../campuses'
import {buildingsOptions} from '../building-hours/query'
import {fetchDirectories} from './directory/fetch'
import {mapDataOptions} from './query'

/// How long a card treats the feeds it reads as current. Every card, and every
/// sheet stacked over one, mounts afresh, so without this each would refetch
/// both whole feeds; the hours and the map change a few times a term.
const CARD_STALE_TIME = 5 * 60 * 1000

/// The Hours screen's own query, as a map card reads it. Only a campus whose
/// venues carry building keys is asked.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const cardVenuesOptions = (campus: CampusId) => {
	let {map, hours} = campusById(campus)
	return {
		...buildingsOptions(campus),
		enabled: Boolean(map?.venuesByBuilding && hours),
		staleTime: CARD_STALE_TIME,
	}
}

/// The map screen's own query, as a map card reads it.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const cardFeaturesOptions = (campus: CampusId) => ({
	...mapDataOptions(campus),
	staleTime: CARD_STALE_TIME,
})

/// The building directories' cache key.
export const directoryKeys = {
	all: (campus: CampusId) => ['building-directory', campus] as const,
}

/// Every building's directory, as a card reads it, for a campus that keeps them.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const cardDirectoryOptions = (campus: CampusId) => ({
	queryKey: directoryKeys.all(campus),
	queryFn: ({signal}: {signal: AbortSignal}) => fetchDirectories(campus, signal),
	enabled: campusById(campus).map?.buildingDirectory !== undefined,
	staleTime: CARD_STALE_TIME,
})
