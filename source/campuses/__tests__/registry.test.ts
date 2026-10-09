import {describe, expect, test} from '@jest/globals'

import {
	CAMPUSES,
	CAMPUS_IDS,
	UnknownCampusError,
	campusById,
	campusIdFromPublished,
	isCampusId,
	requireCampusId,
} from '..'

describe('the campus registry', () => {
	test('lists St. Olaf first, then Carleton, by reverse-DNS id', () => {
		expect(CAMPUSES.map((campus) => campus.id)).toEqual(['edu.stolaf', 'edu.carleton'])
	})

	test('defines exactly the ids CAMPUS_IDS lists, in its order', () => {
		expect(CAMPUSES.map((campus) => campus.id)).toEqual([...CAMPUS_IDS])
	})

	test('has no duplicate ids', () => {
		let ids = CAMPUSES.map((campus) => campus.id)
		expect(new Set(ids).size).toBe(ids.length)
	})

	test('finds a campus by id', () => {
		expect(campusById('edu.carleton').name).toBe('Carleton College')
	})

	test('knows its own ids and nothing else', () => {
		expect(isCampusId('edu.stolaf')).toBe(true)
		expect(isCampusId('stolaf')).toBe(false)
		expect(isCampusId('carleton.edu')).toBe(false)
		expect(isCampusId(undefined)).toBe(false)
	})

	test('refuses an unknown id, naming the known ones and where it came from', () => {
		expect(() => requireCampusId('carleton.edu', '--campus')).toThrow(UnknownCampusError)
		expect(() => requireCampusId('carleton.edu', '--campus')).toThrow(
			'--campus names carleton.edu, but the campuses are edu.stolaf, edu.carleton',
		)
	})
})

describe("each campus's server", () => {
	test('saves each override under its campus id', () => {
		expect(campusById('edu.stolaf').api.storageKey).toBe('settings:server-address:edu.stolaf')
		expect(campusById('edu.carleton').api.storageKey).toBe('settings:server-address:edu.carleton')
	})

	test('saves no two campuses under one key', () => {
		let keys = CAMPUSES.map((campus) => campus.api.storageKey)
		expect(new Set(keys).size).toBe(keys.length)
	})

	test('ends in a slash, so ky extends the path rather than replacing its last segment', () => {
		for (let campus of CAMPUSES) {
			expect(campus.api.defaultUrl).toMatch(/\/$/u)
		}
	})
})

describe('published campus keys', () => {
	test('read the ids 2.9 published under, and reverse-DNS ids', () => {
		expect(campusIdFromPublished('stolaf')).toBe('edu.stolaf')
		expect(campusIdFromPublished('carleton')).toBe('edu.carleton')
		expect(campusIdFromPublished('edu.carleton')).toBe('edu.carleton')
	})

	test('name no campus for any other key', () => {
		expect(campusIdFromPublished('macalester')).toBeUndefined()
		expect(campusIdFromPublished('carleton.edu')).toBeUndefined()
	})
})
