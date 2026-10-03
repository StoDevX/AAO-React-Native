import {describe, expect, test} from '@jest/globals'

import {radioCredits} from '../credits'
import {STATIONS} from '../stations'

describe('radioCredits', () => {
	test('credits each station once, under the name the player gives it', () => {
		expect(radioCredits().map((credit) => credit.label)).toEqual([
			STATIONS.ksto.stationName,
			STATIONS.krlx.stationName,
		])
	})

	test('links each station to its own site', () => {
		expect(radioCredits().map((credit) => credit.url)).toEqual([
			'https://www.kstoradio.org/',
			'https://www.krlx.org/',
		])
	})
})
