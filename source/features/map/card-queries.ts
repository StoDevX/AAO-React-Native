import {buildingsOptions} from '../building-hours/query'
import type {Campus} from '../building-hours/types'
import {fetchDirectories} from './directory/fetch'
import {mapDataOptions} from './query'

/// How long a card treats the feeds it reads as current. Every card, and every
/// sheet stacked over one, mounts afresh, so without this each would refetch
/// both whole feeds; the hours and the map change a few times a term.
const CARD_STALE_TIME = 5 * 60 * 1000

/// The Hours screen's own query, as a map card reads it. Only St. Olaf's
/// venues carry building keys, so a Carleton card never asks.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const cardVenuesOptions = (campus: Campus) => ({
	...buildingsOptions(campus),
	enabled: campus === 'stolaf',
	staleTime: CARD_STALE_TIME,
})

/// The map screen's own query, as a map card reads it.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const cardFeaturesOptions = (campus: Campus) => ({
	...mapDataOptions(campus),
	staleTime: CARD_STALE_TIME,
})

/// The building directories' cache key.
export const directoryKeys = {
	all: (campus: Campus) => ['building-directory', campus] as const,
}

/// Every building's directory, as a card reads it. St. Olaf's only: Carleton
/// keeps no directory files.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const cardDirectoryOptions = (campus: Campus) => ({
	queryKey: directoryKeys.all(campus),
	queryFn: ({signal}: {signal: AbortSignal}) => fetchDirectories(signal),
	enabled: campus === 'stolaf',
	staleTime: CARD_STALE_TIME,
	// Offline, an online-only query pauses without calling its function, and
	// the bundled copy -- the fallback inside it -- would never stand in.
	networkMode: 'offlineFirst' as const,
})
