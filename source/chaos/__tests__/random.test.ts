import {launchSeed, seededRandom} from '../random'

describe('seededRandom', () => {
	test('repeats its sequence for the same seed', () => {
		let a = seededRandom(42)
		let b = seededRandom(42)
		let first = [a(), a(), a(), a()]
		expect([b(), b(), b(), b()]).toEqual(first)
	})

	test('differs between seeds', () => {
		expect(seededRandom(1)()).not.toEqual(seededRandom(2)())
	})

	test('stays within [0, 1)', () => {
		let random = seededRandom(7)
		for (let i = 0; i < 10_000; i++) {
			let n = random()
			expect(n).toBeGreaterThanOrEqual(0)
			expect(n).toBeLessThan(1)
		}
	})
})

describe('launchSeed', () => {
	test('gives each launch of a run its own seed', () => {
		expect(launchSeed(42, 0)).not.toEqual(launchSeed(42, 1))
	})

	test('is stable', () => {
		expect(launchSeed(42, 3)).toEqual(launchSeed(42, 3))
	})
})
