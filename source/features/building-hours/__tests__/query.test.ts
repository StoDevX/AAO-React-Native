import {describe, expect, jest, test} from '@jest/globals'

// query.ts pulls in the redux barrel for useGroupedBuildings' favorites
// selector. That barrel eagerly configures the store, which wires up the
// Sentry enhancer -- and Sentry's React Native SDK reaches for the native
// fetch module on import, which doesn't exist under Jest. None of that is
// exercised by the tests below, so stub it out rather than pull in a real
// store.
jest.mock('../../../redux', () => ({
	selectFavoriteBuildings: jest.fn(),
	useAppSelector: jest.fn(),
}))

import moment from 'moment-timezone'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {useNowOverride} from '@frogpond/timer'
import {buildingByNameOptions, buildingsOptions, keys} from '../query'

describe('keys', () => {
	test('scopes the cache key by campus', () => {
		expect(keys.all('edu.stolaf')).toEqual(['edu.stolaf', 'buildings'])
		expect(keys.all('edu.carleton')).toEqual(['edu.carleton', 'buildings'])
	})

	test('gives the two campuses different keys', () => {
		expect(keys.all('edu.stolaf')).not.toEqual(keys.all('edu.carleton'))
	})
})

describe('buildingByNameOptions', () => {
	test('shares its query key with buildingsOptions for the same campus, so the detail sheet reads a warm cache', () => {
		expect(buildingByNameOptions('edu.stolaf', 'Rølvaag Library').queryKey).toEqual(
			buildingsOptions('edu.stolaf').queryKey,
		)
		expect(buildingByNameOptions('edu.carleton', 'The Libe').queryKey).toEqual(
			buildingsOptions('edu.carleton').queryKey,
		)
	})

	test('does not share a query key across campuses', () => {
		expect(buildingByNameOptions('edu.stolaf', 'Rølvaag Library').queryKey).not.toEqual(
			buildingByNameOptions('edu.carleton', 'Rølvaag Library').queryKey,
		)
	})
})

describe('fetching the hours', () => {
	let fetchHours = async (campus: 'edu.stolaf') => {
		let requested: string[] = []
		setFetchInterceptor((request) => {
			requested.push(request.url)
			return Promise.resolve(Response.json({data: []}))
		})
		let {queryFn} = buildingsOptions(campus)
		await (queryFn as (context: {signal: AbortSignal}) => Promise<unknown>)({
			signal: new AbortController().signal,
		})
		setFetchInterceptor(null)
		return requested
	}

	test("asks for today's hours on the real clock", async () => {
		registerCampusServer('edu.stolaf', new URL('https://hours.test/v1/'))
		useNowOverride.getState().clear()
		expect(await fetchHours('edu.stolaf')).toEqual(['https://hours.test/v1/spaces/hours'])
	})

	test("asks for the frozen clock's campus date once the dev sheet moves it", async () => {
		registerCampusServer('edu.stolaf', new URL('https://hours.test/v1/'))
		// 1 AM UTC on the 14th is still the 13th, the last day of fall break, on campus
		useNowOverride.getState().freeze(moment.utc('2026-10-14T01:00:00Z'))
		expect(await fetchHours('edu.stolaf')).toEqual([
			'https://hours.test/v1/spaces/hours?date=2026-10-13',
		])
		useNowOverride.getState().clear()
	})
})
