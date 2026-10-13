import {describe, expect, test} from '@jest/globals'

import {CAMPUSES, campusById} from '../../../campuses'
import {anyScheduleEntry, scheduleEntry} from '../entries'

describe('a schedule by id', () => {
	test('is found on the campus that lists it', () => {
		expect(scheduleEntry(campusById('edu.carleton'), 'sumo')?.calendar).toBe('sumo-schedule')
	})

	test('is not found on a campus that does not list it', () => {
		expect(scheduleEntry(campusById('edu.stolaf'), 'sumo')).toBeUndefined()
	})

	test('is not found on a campus without schedules', () => {
		let campus = {...campusById('example.college'), schedules: undefined}
		expect(scheduleEntry(campus, 'kmnk')).toBeUndefined()
	})

	test("is found from any campus by the player, which plays every campus's stations", () => {
		expect(anyScheduleEntry('krlx')?.calendar).toBe('krlx-schedule')
		expect(anyScheduleEntry('nowhere')).toBeUndefined()
	})
})

describe('schedule ids', () => {
	test('are unique across campuses, since a route names one', () => {
		let ids = CAMPUSES.flatMap((campus) => campus.schedules?.entries ?? []).map((entry) => entry.id)
		expect(new Set(ids).size).toBe(ids.length)
	})

	test("name, for each station, an entry of the station's own campus", () => {
		for (let campus of CAMPUSES) {
			for (let station of campus.radio?.stations ?? []) {
				expect(scheduleEntry(campus, station.schedule)).toBeDefined()
			}
		}
	})
})
