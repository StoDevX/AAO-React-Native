/**
 * How far the captions must be scrolled before there is content above worth a
 * fade at the top: more than the few points a line settling or a bounce can move them.
 */
const CONTENT_ABOVE_THRESHOLD = 8

/** Whether the captions are scrolled far enough down that earlier lines are out of view above. */
export function hasContentAbove(offsetY: number): boolean {
	return offsetY > CONTENT_ABOVE_THRESHOLD
}
