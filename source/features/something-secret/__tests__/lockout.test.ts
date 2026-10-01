import {clampLockedUntil, isLockedOut, lockoutMinutes, MAX_LOCKOUT_MS} from '../lockout'

const NOW = 1_800_000_000_000
const MINUTE = 60_000

describe('lockoutMinutes', () => {
	it.each([
		[1, 1],
		[2, 5],
		[3, 15],
		[4, 15],
		[40, 15],
	])('locks press %i out for %i minutes', (press, minutes) => {
		expect(lockoutMinutes(press)).toBe(minutes)
	})
})

describe('isLockedOut', () => {
	it('is not locked with no lockout set', () => {
		expect(isLockedOut(null, NOW)).toBe(false)
	})

	it('is locked until the moment the lockout ends', () => {
		expect(isLockedOut(NOW + 1, NOW)).toBe(true)
		expect(isLockedOut(NOW, NOW)).toBe(false)
		expect(isLockedOut(NOW - 1, NOW)).toBe(false)
	})
})

describe('clampLockedUntil', () => {
	it('keeps a lockout up to fifteen minutes ahead', () => {
		expect(MAX_LOCKOUT_MS).toBe(15 * MINUTE)
		expect(clampLockedUntil(NOW + 15 * MINUTE, NOW)).toBe(NOW + 15 * MINUTE)
	})

	it('drops one further ahead than any lockout lasts, as after the clock moved back', () => {
		expect(clampLockedUntil(NOW + 15 * MINUTE + 1, NOW)).toBeNull()
		expect(clampLockedUntil(NOW + 24 * 60 * MINUTE, NOW)).toBeNull()
	})

	it('leaves no lockout as none', () => {
		expect(clampLockedUntil(null, NOW)).toBeNull()
	})
})
