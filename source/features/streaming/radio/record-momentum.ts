/** Time in seconds for the remaining velocity difference to fall by a factor of e. */
const COAST_TIME_CONSTANT = 0.3

/** A smaller difference in degrees per second can settle straight to the target speed. */
const SETTLED_VELOCITY = 1

/** A finite coast animation for the rotation added to the steady spin. */
type RecordMomentum = {
	duration: number
	rotation: number
	easing: (progress: number) => number
}

/**
 * The extra rotation over a steady target speed, integrated from an
 * exponentially decaying velocity difference. Speeds are degrees per second;
 * duration is milliseconds, and rotation is degrees. A reverse flick eases
 * through zero into the target speed without changing angle at release.
 */
export function recordMomentum(
	releaseVelocity: number,
	targetVelocity: number,
): RecordMomentum | null {
	let difference = releaseVelocity - targetVelocity
	if (Math.abs(difference) <= SETTLED_VELOCITY) {
		return null
	}

	let decay = Math.log(Math.abs(difference) / SETTLED_VELOCITY)
	let fraction = 1 - Math.exp(-decay)
	return {
		duration: decay * COAST_TIME_CONSTANT * 1000,
		rotation: difference * COAST_TIME_CONSTANT * fraction,
		easing: (progress: number): number => {
			'worklet'
			return (1 - Math.exp(-progress * decay)) / fraction
		},
	}
}
