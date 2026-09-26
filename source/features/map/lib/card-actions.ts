import type {Coordinate} from '../types'
import {appleMapsDirectionsUrl} from '../urls'

/// One button in the card's actions row. Directions is the only kind the
/// feeds support today; Call, Website and a venue's own action (Menus, Shows)
/// join it as their data arrives.
export type CardAction = {kind: 'directions'; url: string}

/// Apple Maps' row holds Directions and up to three more.
export const MAX_CARD_ACTIONS = 4

/// Whether the card may offer Directions. Maps routes by car and transit, and
/// campus is walked, so Directions waits on a walking routing engine.
export const WALKING_DIRECTIONS = false

/// The actions a building's card offers, in the row's order.
export function cardActions({
	point,
	walkingDirections,
}: {
	point: Coordinate | null
	walkingDirections: boolean
}): Array<CardAction> {
	let actions: Array<CardAction> = []
	if (point && walkingDirections) {
		actions.push({kind: 'directions', url: appleMapsDirectionsUrl(point)})
	}
	return actions.slice(0, MAX_CARD_ACTIONS)
}
