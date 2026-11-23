import {describe, expect, test} from '@jest/globals'

import {campusById} from '../../../../campuses'
import {STATION_LIST, STATIONS, stationsOffered, stationToShow} from '../stations'

const allOn = () => true

describe('the stations the player offers', () => {
	// Every campus's stations on every campus, St. Olaf's first: KSTO | KRLX, as before.
	test("are every campus's, in the registry's order", () => {
		expect(STATION_LIST.map((station) => station.id)).toEqual(['ksto', 'krlx', 'kmnk'])
	})

	test("leave out a dev-only campus's stations", () => {
		expect(stationsOffered(campusById('edu.stolaf'), allOn).map((s) => s.id)).toEqual([
			'ksto',
			'krlx',
		])
		expect(stationsOffered(campusById('edu.carleton'), allOn).map((s) => s.id)).toEqual([
			'ksto',
			'krlx',
		])
	})

	test('offer only its own stations on a dev-only campus', () => {
		expect(stationsOffered(campusById('example.college'), allOn).map((s) => s.id)).toEqual(['kmnk'])
	})

	test('leave out stations that are switched off', () => {
		expect(
			stationsOffered(campusById('edu.carleton'), (id) => id === 'ksto').map((s) => s.id),
		).toEqual(['ksto'])
		expect(stationsOffered(campusById('edu.carleton'), () => false)).toEqual([])
	})

	test('are each found by id', () => {
		expect(STATIONS.ksto.stationName).toBe('KSTO 93.1 FM')
		expect(STATIONS.krlx.stationName).toBe('88.1 KRLX-FM')
	})
})

describe('the station the player shows', () => {
	test('is the one being viewed while it is offered', () => {
		expect(stationToShow('krlx', [STATIONS.ksto, STATIONS.krlx])).toBe('krlx')
	})

	test('moves to the first offered station once the viewed one is switched off', () => {
		expect(stationToShow('ksto', [STATIONS.krlx])).toBe('krlx')
	})

	test('stays on the viewed station when none is offered', () => {
		expect(stationToShow('ksto', [])).toBe('ksto')
	})
})
