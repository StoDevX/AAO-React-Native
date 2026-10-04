/** A source of floats in [0, 1). */
export type Random = () => number

/**
 * Mulberry32: small, fast, and the same sequence for the same seed everywhere,
 * which is what lets a chaos run be replayed.
 */
export function seededRandom(seed: number): Random {
	let state = seed >>> 0
	return () => {
		// eslint-disable-next-line unicorn/number-literal-case
		state = (state + 0x6d2b79f5) >>> 0
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/**
 * The seed for one launch of a run. A run relaunches the app whenever the
 * monkey opens a route by URL; without this each launch would draw the same
 * faults in the same order.
 */
export function launchSeed(seed: number, launch: number): number {
	// eslint-disable-next-line unicorn/number-literal-case
	return (Math.imul(seed ^ 0x9e3779b9, 31) + launch) >>> 0
}
