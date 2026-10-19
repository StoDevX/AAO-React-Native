/**
 * How far the captions must be scrolled before there is content above worth a
 * fade at the top: more than the few points a line settling or a bounce can move them.
 */
const CONTENT_ABOVE_THRESHOLD = 8

/** Whether the captions are scrolled far enough down that earlier lines are out of view above. */
export function hasContentAbove(offsetY: number): boolean {
	return offsetY > CONTENT_ABOVE_THRESHOLD
}

/**
 * How far from the end the captions must be scrolled before there is content
 * below worth a fade at the bottom: more than the few points of rounding or a bounce.
 */
const CONTENT_BELOW_THRESHOLD = 8

/**
 * Whether the captions are scrolled far enough up that later lines are out of
 * view below. An area not yet laid out (no height) has nothing below.
 */
export function hasContentBelow(
	offsetY: number,
	viewportHeight: number,
	contentHeight: number,
): boolean {
	return viewportHeight > 0 && contentHeight - (offsetY + viewportHeight) > CONTENT_BELOW_THRESHOLD
}
