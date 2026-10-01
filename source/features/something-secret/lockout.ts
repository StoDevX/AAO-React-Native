/** The longest any lockout lasts, in minutes. */
const LONGEST_MINUTES = 15
/** Minutes locked out for the first press, the second, and every press after. */
const LADDER = [1, 5, LONGEST_MINUTES]

export const MAX_LOCKOUT_MS = LONGEST_MINUTES * 60_000

/** How long the `pressCount`th press of the red button locks the app, counting from 1. */
export function lockoutMinutes(pressCount: number): number {
	return LADDER[Math.min(pressCount, LADDER.length) - 1]
}

export function isLockedOut(lockedUntil: number | null, now: number): boolean {
	return lockedUntil !== null && lockedUntil > now
}

/**
 * The lockout end, or none when it is further off than any lockout lasts: the device clock moved
 * backwards since the press, and honoring it would lock the app for hours.
 */
export function clampLockedUntil(lockedUntil: number | null, now: number): number | null {
	if (lockedUntil === null || lockedUntil - now > MAX_LOCKOUT_MS) {
		return null
	}
	return lockedUntil
}
