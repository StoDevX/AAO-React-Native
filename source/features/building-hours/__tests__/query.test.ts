import {beforeEach, describe, expect, jest, test} from '@jest/globals'

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
import {queryClient} from '../../../init/tanstack-query'
import {buildingByNameOptions, buildingsOptions, keys} from '../query'
import type {BuildingType, NamedBuildingScheduleType} from '../types'

const calendar = {
	data: {
		timezone: 'America/Chicago',
		breaks: {fall: {name: 'Fall Break', start: '2026-10-10', end: '2026-10-13'}},
	},
}
const usual: NamedBuildingScheduleType[] = [
	{title: 'Hours', hours: [{days: ['Mo'], from: '7:45am', to: '12:00am'}]},
]
const closed = {
	schedule: [{title: 'Fall Break', isPhysicallyOpen: false, hours: []}],
	exceptions: [],
}
const library = {
	name: 'Rølvaag Library',
	category: 'Libraries',
	schedule: usual,
	exceptions: [],
	breakSchedule: {fall: closed},
}

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
			if (request.url.includes('/breaks')) return Promise.resolve(Response.json(calendar))
			return Promise.resolve(Response.json({data: [library]}))
		})
		let {queryFn} = buildingsOptions(campus)
		let buildings = await (queryFn as (context: {signal: AbortSignal}) => Promise<BuildingType[]>)({
			signal: new AbortController().signal,
		})
		setFetchInterceptor(null)
		return {requested, buildings}
	}

	beforeEach(() => {
		registerCampusServer('edu.stolaf', new URL('https://hours.test/v1/'))
		queryClient.clear()
		useNowOverride.getState().clear()
	})

	test("asks for today's hours on the real clock, with the server's break applied", async () => {
		let {requested} = await fetchHours('edu.stolaf')
		expect(requested).toEqual(['https://hours.test/v1/spaces/hours'])
	})

	test("applies the frozen moment's break to the usual schedules", async () => {
		// 1 AM UTC on the 14th is still the 13th, the last day of fall break, on campus
		useNowOverride.getState().freeze(moment.utc('2026-10-14T01:00:00Z'))
		let {requested, buildings} = await fetchHours('edu.stolaf')
		expect(requested.toSorted()).toEqual([
			'https://hours.test/v1/breaks',
			'https://hours.test/v1/spaces/hours?breaks=none',
		])
		expect(buildings[0]?.schedule).toEqual(closed.schedule)
	})

	test('moves the clock again without asking the server again', async () => {
		useNowOverride.getState().freeze(moment.utc('2026-10-14T01:00:00Z'))
		await fetchHours('edu.stolaf')
		useNowOverride.getState().freeze(moment.utc('2026-09-07T15:00:00Z'))
		let {requested, buildings} = await fetchHours('edu.stolaf')
		expect(requested).toEqual([])
		expect(buildings[0]?.schedule).toEqual(usual)
	})
})
