import {unitsAvailability} from '../units'

describe('unitsAvailability', () => {
	test('is ready whenever there is a map, even after a failed refetch', () => {
		expect(unitsAvailability({data: {}, isError: true, fetchStatus: 'idle'})).toBe('ready')
	})

	test('is unavailable when the map failed with nothing saved', () => {
		expect(unitsAvailability({data: undefined, isError: true, fetchStatus: 'idle'})).toBe(
			'unavailable',
		)
	})

	// Offline, a query that has never run waits for a connection forever.
	test('is unavailable when paused offline with nothing saved', () => {
		expect(unitsAvailability({data: undefined, isError: false, fetchStatus: 'paused'})).toBe(
			'unavailable',
		)
	})

	test('is loading while the first fetch runs', () => {
		expect(unitsAvailability({data: undefined, isError: false, fetchStatus: 'fetching'})).toBe(
			'loading',
		)
	})
})
