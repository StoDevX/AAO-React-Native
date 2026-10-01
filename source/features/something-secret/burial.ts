/** How long the app must go unopened before a reburied slab's space comes back. */
export const REST_MS = 12 * 60 * 60 * 1000

export type Burial = {
	/** Whether the slab's space is gone from the home screen */
	buried: boolean
	/** When the app was last in the foreground, in milliseconds since the epoch */
	lastActiveAt: number | null
}

/** The burial as the app comes to the foreground at `now`: a long enough absence digs it up. */
export function wakeUp({buried, lastActiveAt}: Burial, now: number): Burial {
	let rested = lastActiveAt !== null && now - lastActiveAt >= REST_MS
	return {buried: buried && !rested, lastActiveAt: now}
}
