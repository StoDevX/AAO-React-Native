import type {Building, Feature} from '../types'

/// How many places Recents keeps, as Maps does.
export const RECENT_PLACES_LIMIT = 10

/// The recent places with `id` just opened: first, listed once, and no more
/// than the limit.
export function withRecentPlace(recent: string[], id: string): string[] {
	return [id, ...recent.filter((other) => other !== id)].slice(0, RECENT_PLACES_LIMIT)
}

/// The recent places with `id` removed, as a swipe on its row does.
export function withoutRecentPlace(recent: string[], id: string): string[] {
	return recent.filter((other) => other !== id)
}

/// The remembered places the map still has, in the order they were opened. A
/// place the feed has since dropped has no row to open.
export function recentPlaces(
	recent: string[],
	places: Array<Feature<Building>>,
): Array<Feature<Building>> {
	let byId = new Map(places.map((place) => [place.id, place]))
	return recent.flatMap((id) => {
		let place = byId.get(id)
		return place ? [place] : []
	})
}
