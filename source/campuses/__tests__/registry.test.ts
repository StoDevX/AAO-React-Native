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
import {sectionServer} from '../../features/campus/section-server'
import {carleton} from '../edu-carleton'
import {stolaf} from '../edu-stolaf'

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

describe('the map and hours sections', () => {
	test("keep each campus's map where it was", () => {
		expect(stolaf.map.title).toBe('St. Olaf Map')
		expect(stolaf.map.center).toEqual([-93.1839, 44.4618])
		expect(carleton.map.title).toBe('Carleton Map')
		expect(carleton.map.center).toEqual([-93.15488752015, 44.460800862266])
	})

	test("draw a dark basemap only where the campus's style has one", () => {
		expect(stolaf.map.darkStyle).toEqual({manifestId: 'stolaf-dark'})
		expect('darkStyle' in carleton.map).toBe(false)
	})

	test("title Hours as each campus's tile does", () => {
		expect(stolaf.hours.title).toBe('Hours')
		expect(carleton.hours.title).toBe('Building Hours')
	})

	test('offer the map from Hours only where the map has no tile of its own', () => {
		expect(stolaf.hours.showsMapButton).toBe(false)
		expect(carleton.hours.showsMapButton).toBe(true)
	})
})

describe('the calendar, news, paper and radio sections', () => {
	test('offer each campus its own calendars, by source id', () => {
		expect(stolaf.calendar.sources).toEqual(['stolaf', 'presence'])
		expect(carleton.calendar.sources).toEqual(['carleton'])
	})

	test("name each campus's own news site", () => {
		expect(stolaf.news.source).toEqual({id: 'stolaf', title: 'St. Olaf News', thumbnail: 'stolaf'})
		expect(carleton.news.source).toEqual({
			id: 'carleton-now',
			title: 'Carleton News',
			thumbnail: false,
		})
	})

	test("name each campus's student paper", () => {
		expect(stolaf.paper.id).toBe('mess')
		expect(carleton.paper.id).toBe('carletonian')
	})

	test("name each campus's own station", () => {
		expect(stolaf.radio.stations.map((station) => station.id)).toEqual(['ksto'])
		expect(carleton.radio.stations.map((station) => station.id)).toEqual(['krlx'])
	})
})

describe('the convos section', () => {
	test("only Carleton has one, and it asks Carleton's own server", () => {
		expect(stolaf).not.toHaveProperty('convos')
		expect(carleton.convos).toBeDefined()
		expect(sectionServer(carleton.id, carleton.convos)).toBe('edu.carleton')
	})
})
