import {buildingsOptions} from '../building-hours/query'
import type {Campus} from '../building-hours/types'
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
