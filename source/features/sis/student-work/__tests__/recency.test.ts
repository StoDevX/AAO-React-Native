import {recencyOf, RECENCY_ORDER} from '../recency'

// A Saturday, as the UI tests' frozen clock is.
const TODAY = new Date(2026, 8, 5, 12)

describe('recencyOf', () => {
	test('files a posting from the last seven days under This Week', () => {
		expect(recencyOf('2026-09-05', TODAY)).toBe('This Week')
		expect(recencyOf('2026-08-30', TODAY)).toBe('This Week')
	})

	test('files one from seven to thirteen days ago under Last Week', () => {
		expect(recencyOf('2026-08-29', TODAY)).toBe('Last Week')
		expect(recencyOf('2026-08-23', TODAY)).toBe('Last Week')
	})

	test('files anything older under Earlier', () => {
		expect(recencyOf('2026-08-22', TODAY)).toBe('Earlier')
		expect(recencyOf('2025-09-05', TODAY)).toBe('Earlier')
	})

	/// A posting dated after the device's today -- a clock set wrong, or one
	/// published in another zone -- is still new.
	test('files a posting dated in the future under This Week', () => {
		expect(recencyOf('2026-09-10', TODAY)).toBe('This Week')
	})

	test('files a posting it cannot date under Earlier', () => {
		expect(recencyOf('', TODAY)).toBe('Earlier')
	})

	test('lists the sections newest first', () => {
		expect(RECENCY_ORDER).toEqual(['This Week', 'Last Week', 'Earlier'])
	})
})
