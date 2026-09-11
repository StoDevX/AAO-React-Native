import {describe, expect, it} from '@jest/globals'
import {isScheduleRowActive} from '../is-schedule-row-active'
import {plainMoment} from './moment.helper'
import {NamedBuildingScheduleType, SingleBuildingScheduleType} from '../../types'

let at = (date: string, time: string) => plainMoment(`${date}T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

// data/building-hours/8-bc.yaml. 2026-09-11 is a Friday.
const buntrock: NamedBuildingScheduleType = {
	title: 'Hours',
	hours: [
		{days: ['Su', 'Mo', 'Tu', 'We', 'Th'], from: '7:00am', to: '12:00am'},
		{days: ['Fr', 'Sa'], from: '7:00am', to: '1:00am'},
	],
}
const weeknights = buntrock.hours[0] as SingleBuildingScheduleType
const weekends = buntrock.hours[1] as SingleBuildingScheduleType

describe('a row whose window opened last night', () => {
	it('is active early Sunday, while Saturday night runs on', () => {
		expect(isScheduleRowActive(buntrock, weekends, at('2026-09-13', '00:30:00'))).toBe(true)
	})

	it('is inactive early Friday, when no night of the week is running', () => {
		expect(isScheduleRowActive(buntrock, weekends, at('2026-09-11', '00:30:00'))).toBe(false)
	})

	it('is inactive once Saturday night has ended', () => {
		expect(isScheduleRowActive(buntrock, weekends, at('2026-09-13', '02:00:00'))).toBe(false)
	})
})

describe('an ordinary row', () => {
	it('is active inside its own window', () => {
		expect(isScheduleRowActive(buntrock, weeknights, at('2026-09-14', '12:00:00'))).toBe(true)
	})

	it('is inactive on a day it does not cover', () => {
		// Friday is not in the weeknight row's days.
		expect(isScheduleRowActive(buntrock, weeknights, at('2026-09-11', '12:00:00'))).toBe(false)
	})
})

describe('the set-level flags', () => {
	it('is inactive when the set is not physically open', () => {
		let closed: NamedBuildingScheduleType = {...buntrock, isPhysicallyOpen: false}

		expect(isScheduleRowActive(closed, weekends, at('2026-09-13', '00:30:00'))).toBe(false)
	})

	it('is inactive during chapel when the set closes for it', () => {
		// Monday chapel is 10:10-10:30am.
		let chapelClosed: NamedBuildingScheduleType = {
			title: 'Hours',
			closedForChapelTime: true,
			hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
		}

		expect(
			isScheduleRowActive(chapelClosed, chapelClosed.hours[0], at('2026-09-07', '10:15:00')),
		).toBe(false)
	})
})
