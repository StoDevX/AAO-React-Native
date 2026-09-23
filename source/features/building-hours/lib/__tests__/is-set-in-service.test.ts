import {describe, expect, test} from '@jest/globals'

import {isSetInService} from '../is-set-in-service'
import type {NamedBuildingScheduleType} from '../../types'
import {dayMoment} from './moment.helper'

const HOURS: NamedBuildingScheduleType = {
	title: 'Hours',
	hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}],
}

describe('isSetInService', () => {
	test('counts a set whose doors are open', () => {
		expect(isSetInService(HOURS, dayMoment('Mon 10:15am'))).toBe(true)
	})

	// The college's word that the doors are shut, whatever the hours read.
	test('passes over a set whose doors are not open', () => {
		expect(isSetInService({...HOURS, isPhysicallyOpen: false}, dayMoment('Mon 12:00pm'))).toBe(
			false,
		)
	})

	// Monday chapel runs 10:10 to 10:30.
	test('passes over a set shut for chapel while chapel runs', () => {
		let observesChapel = {...HOURS, closedForChapelTime: true}
		expect(isSetInService(observesChapel, dayMoment('Mon 10:15am'))).toBe(false)
		expect(isSetInService(observesChapel, dayMoment('Mon 10:05am'))).toBe(true)
	})
})
