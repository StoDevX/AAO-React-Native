import {idsNeedingDetail, unitsAvailability, unitsByPosting} from '../units'

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

describe('idsNeedingDetail', () => {
	test('lists board postings the map lacks', () => {
		let published = new Map([['1', '11725']])
		expect(idsNeedingDetail(['1', '2'], published)).toEqual(['2'])
	})

	// Null is the server's answer that the posting names no unit.
	test('does not list a posting the map gives as null', () => {
		expect(idsNeedingDetail(['1'], new Map([['1', null]]))).toEqual([])
	})

	// Without a map, every posting would need its detail: 121 requests.
	test('lists nothing when there is no map', () => {
		expect(idsNeedingDetail(['1', '2'], undefined)).toEqual([])
	})
})

describe('unitsByPosting', () => {
	test('joins the map and the details', () => {
		let units = unitsByPosting(new Map([['1', '11725']]), new Map([['2', '22005']]))
		expect(units).toEqual(
			new Map([
				['1', '11725'],
				['2', '22005'],
			]),
		)
	})

	test('is the details alone when there is no map', () => {
		expect(unitsByPosting(undefined, new Map([['2', null]]))).toEqual(new Map([['2', null]]))
	})
})
