import {describe, expect, test} from '@jest/globals'

import {isStationOn, mustStopStation, stationFlagsFrom} from '../station-flags'

describe('stationFlagsFrom', () => {
	test('reads each station', () => {
		expect(stationFlagsFrom({radio: {ksto: {enabled: true}, krlx: {enabled: false}}})).toEqual({
			ksto: {enabled: true},
			krlx: {enabled: false},
		})
	})

	test('ignores stations this build does not know', () => {
		expect(stationFlagsFrom({radio: {ksto: {enabled: true}, wxyz: {enabled: true}}})).toEqual({
			ksto: {enabled: true},
		})
	})

	test('has nothing for a switch that is not a boolean', () => {
		expect(stationFlagsFrom({radio: {ksto: {enabled: 'true'}}})).toBeUndefined()
	})

	test('has nothing when the file has no radio, or has not loaded', () => {
		expect(stationFlagsFrom({chat: {}})).toBeUndefined()
		expect(stationFlagsFrom(undefined)).toBeUndefined()
	})
})

describe('isStationOn', () => {
	test('is on only when the file says so', () => {
		expect(isStationOn('ksto', {ksto: {enabled: true}}, false)).toBe(true)
		expect(isStationOn('ksto', {ksto: {enabled: false}}, false)).toBe(false)
	})

	test('is off for a station the file leaves out', () => {
		expect(isStationOn('krlx', {ksto: {enabled: true}}, false)).toBe(false)
	})

	test('is off before the file has loaded', () => {
		expect(isStationOn('ksto', undefined, false)).toBe(false)
	})

	test('is on for every station in a build that ignores the switches', () => {
		expect(isStationOn('krlx', undefined, true)).toBe(true)
		expect(isStationOn('krlx', {krlx: {enabled: false}}, true)).toBe(true)
	})
})

describe('mustStopStation', () => {
	test('stops a loaded station that is switched off', () => {
		expect(mustStopStation({stationId: 'ksto', stationOn: () => false, restoring: false})).toBe(
			true,
		)
	})

	test('waits while the saved switches are still being restored at launch', () => {
		expect(mustStopStation({stationId: 'ksto', stationOn: () => false, restoring: true})).toBe(
			false,
		)
	})

	test('leaves a station that is on, or none loaded', () => {
		expect(mustStopStation({stationId: 'ksto', stationOn: () => true, restoring: false})).toBe(
			false,
		)
		expect(mustStopStation({stationId: null, stationOn: () => false, restoring: false})).toBe(false)
	})
})
