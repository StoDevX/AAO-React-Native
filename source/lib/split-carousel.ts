/// How many tiles a carousel shows before its More tile takes over.
export const CAROUSEL_TILE_LIMIT = 6

/**
 * The tiles a carousel shows, and those its More tile stands for. A More tile
 * takes the place of one tile, so it only earns that place when it hides at
 * least two: seven tiles show all seven.
 */
export function splitCarousel<T>(tiles: Array<T>): {shown: Array<T>; hidden: Array<T>} {
	if (tiles.length <= CAROUSEL_TILE_LIMIT + 1) {
		return {shown: tiles, hidden: []}
	}
	return {shown: tiles.slice(0, CAROUSEL_TILE_LIMIT), hidden: tiles.slice(CAROUSEL_TILE_LIMIT)}
}
