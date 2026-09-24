type Point = {x: number; y: number}

/** How far a finger may move, in points, and still count as a tap. */
const TAP_SLOP = 10

/** Whether a touch that moved `dx`, `dy` in all was a tap rather than a scrub. */
export function isTap(dx: number, dy: number): boolean {
	return Math.hypot(dx, dy) < TAP_SLOP
}

/**
 * The angle of `point` around `centre`, in degrees, from three o'clock. Screen
 * y grows downward, so positive angles run clockwise.
 */
export function angleAround(centre: Point, point: Point): number {
	return (Math.atan2(point.y - centre.y, point.x - centre.x) * 180) / Math.PI
}

/**
 * The turn from one angle to another, in degrees, the short way round. A
 * finger crossing nine o'clock jumps from 180 to -180, and without this the
 * record would spin almost a full turn backwards.
 */
export function turnBetween(from: number, to: number): number {
	let turn = (to - from) % 360
	if (turn > 180) {
		return turn - 360
	}
	if (turn <= -180) {
		return turn + 360
	}
	return turn
}
