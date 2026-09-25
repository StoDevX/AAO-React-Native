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

/** Where the record pointed at a moment of the scratch, in degrees and milliseconds. */
export type ScratchSample = {angle: number; time: number}

/** How far back, in milliseconds, the release speed looks. */
const VELOCITY_WINDOW = 100

/**
 * The record's turn rate as the finger lifts, in degrees per second, measured
 * over the last moments of the scratch. A finger that rested before lifting
 * leaves no samples in that window, and so no momentum.
 */
export function releaseVelocity(samples: ScratchSample[], releasedAt: number): number {
	let recent = samples.filter((sample) => sample.time >= releasedAt - VELOCITY_WINDOW)
	if (recent.length < 2) {
		return 0
	}

	let turn = 0
	for (let index = 1; index < recent.length; index += 1) {
		turn += turnBetween(recent[index - 1].angle, recent[index].angle)
	}
	let first = recent[0].time
	let elapsed = (recent.at(-1)?.time ?? first) - first
	return elapsed > 0 ? (turn / elapsed) * 1000 : 0
}
