/** The smallest the record shrinks to before the player scrolls instead. */
export const MIN_ARTWORK = 160

/**
 * How big the record can be for the whole player to fit in `viewportHeight`.
 * The rest of the player is however tall it laid out, less the record it laid
 * out with, so one measurement is enough. Never wider than `width`, and never
 * smaller than `MIN_ARTWORK`: past that the player scrolls.
 */
export function artworkSize({
	width,
	viewportHeight,
	layoutHeight,
	currentArtwork,
}: {
	width: number
	viewportHeight: number
	layoutHeight: number
	currentArtwork: number
}): number {
	if (viewportHeight === 0 || layoutHeight === 0) {
		return width
	}
	let rest = layoutHeight - currentArtwork
	return Math.max(MIN_ARTWORK, Math.min(width, Math.floor(viewportHeight - rest)))
}
