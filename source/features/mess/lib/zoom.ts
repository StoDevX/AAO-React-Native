/** How far a double tap zooms in. */
export const DOUBLE_TAP_SCALE = 2.5
/** How far past 1× a scale must be to count as zoomed in; a scale can settle a hair off 1. */
const ZOOMED_IN_TOLERANCE = 0.01

type Point = {x: number; y: number}
type Size = {width: number; height: number}
type Rect = Point & Size

/**
 * Where a double tap zooms a picture laid out to fill `window` at 1×: out to the whole
 * picture when zoomed in, else in on the point tapped, given in the picture's own
 * coordinates. Returns the rect to zoom to and the scale that leaves it at.
 */
export function doubleTapZoom(
	scale: number,
	point: Point,
	window: Size,
): {scale: number; rect: Rect} {
	if (scale > 1 + ZOOMED_IN_TOLERANCE) {
		return {scale: 1, rect: {x: 0, y: 0, width: window.width, height: window.height}}
	}
	let width = window.width / DOUBLE_TAP_SCALE
	let height = window.height / DOUBLE_TAP_SCALE
	return {
		scale: DOUBLE_TAP_SCALE,
		rect: {x: point.x - width / 2, y: point.y - height / 2, width, height},
	}
}
