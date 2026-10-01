import {REST_MS, wakeUp} from '../burial'

const NOW = 1_800_000_000_000

describe('wakeUp', () => {
	it('rests for twelve hours', () => {
		expect(REST_MS).toBe(12 * 60 * 60 * 1000)
	})

	it('keeps the slab buried after a gap just short of twelve hours', () => {
		expect(wakeUp({buried: true, lastActiveAt: NOW - REST_MS + 1}, NOW)).toEqual({
			buried: true,
			lastActiveAt: NOW,
		})
	})

	it('digs the slab back up after twelve hours away', () => {
		expect(wakeUp({buried: true, lastActiveAt: NOW - REST_MS}, NOW)).toEqual({
			buried: false,
			lastActiveAt: NOW,
		})
	})

	it('keeps it buried when there is no record of the last visit', () => {
		expect(wakeUp({buried: true, lastActiveAt: null}, NOW).buried).toBe(true)
	})

	it('leaves an unburied slab alone', () => {
		expect(wakeUp({buried: false, lastActiveAt: NOW - 1}, NOW)).toEqual({
			buried: false,
			lastActiveAt: NOW,
		})
	})
})
