import {describe, expect, test} from '@jest/globals'

import {campusById} from '../../../../campuses'
import {STATION_LIST, STATIONS, stationsOffered} from '../stations'

describe('the stations the player offers', () => {
	// Every campus's stations on every campus, St. Olaf's first: KSTO | KRLX, as before.
	test("are every campus's, in the registry's order", () => {
		expect(STATION_LIST.map((station) => station.id)).toEqual(['ksto', 'krlx', 'kmnk'])
	})

	test("leave out a dev-only campus's stations", () => {
		expect(stationsOffered(campusById('edu.stolaf')).map((s) => s.id)).toEqual(['ksto', 'krlx'])
		expect(stationsOffered(campusById('edu.carleton')).map((s) => s.id)).toEqual(['ksto', 'krlx'])
	})

	test("offer a dev-only campus's stations on that campus", () => {
		expect(stationsOffered(campusById('example.college')).map((s) => s.id)).toEqual([
			'ksto',
			'krlx',
			'kmnk',
		])
	})

	test('are each found by id', () => {
		expect(STATIONS.ksto.stationName).toBe('KSTO 93.1 FM')
		expect(STATIONS.krlx.stationName).toBe('88.1 KRLX-FM')
	})
})
