import {describe, expect, test} from '@jest/globals'

import {STATION_LIST, STATIONS} from '../stations'

describe('the stations the player offers', () => {
	// Every campus's stations on every campus, St. Olaf's first: KSTO | KRLX, as before.
	test("are every campus's, in the registry's order", () => {
		expect(STATION_LIST.map((station) => station.id)).toEqual(['ksto', 'krlx'])
	})

	test('are each found by id', () => {
		expect(STATIONS.ksto.stationName).toBe('KSTO 93.1 FM')
		expect(STATIONS.krlx.stationName).toBe('88.1 KRLX-FM')
	})
})
