import {describe, expect, it} from '@jest/globals'
import {findChapelPause} from '../find-chapel-pause'
import {plainMoment} from './moment.helper'
import {NamedBuildingScheduleType} from '../../types'

let at = (date: string, time: string) => plainMoment(`${date}T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

// data/building-hours/3-1-post-office.yaml
const postOffice: NamedBuildingScheduleType = {
	title: 'Hours',
	closedForChapelTime: true,
	hours: [
		{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'},
		{days: ['Sa'], from: '10:00am', to: '1:00pm'},
	],
}

// 2026-09-07 is a Monday; chapel runs 10:10-10:30am.
describe('a set chapel is about to shut', () => {
	it('names the chapel start inside the countdown', () => {
		let pause = findChapelPause(postOffice, at('2026-09-07', '10:05:00'))

		expect(pause?.format('HH:mm')).toBe('10:10')
	})

	it('includes the exact edge of the countdown', () => {
		let pause = findChapelPause(postOffice, at('2026-09-07', '10:00:00'))

		expect(pause?.format('HH:mm')).toBe('10:10')
	})

	it('stays quiet before the countdown begins', () => {
		expect(findChapelPause(postOffice, at('2026-09-07', '09:55:00'))).toBeNull()
	})

	it('stays quiet once chapel is running', () => {
		expect(findChapelPause(postOffice, at('2026-09-07', '10:15:00'))).toBeNull()
	})

	it('stays quiet on a day without chapel', () => {
		// 2026-09-12 is a Saturday; the Saturday window is open at 10am.
		expect(findChapelPause(postOffice, at('2026-09-12', '10:00:00'))).toBeNull()
	})
})

describe('a set chapel will not shut', () => {
	it('stays quiet when the set does not observe chapel', () => {
		let set: NamedBuildingScheduleType = {
			title: 'Hours',
			hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}],
		}

		expect(findChapelPause(set, at('2026-09-07', '10:05:00'))).toBeNull()
	})

	it('stays quiet when the window closes before chapel starts', () => {
		// Closing at 10:05 is this window's own business, not chapel's.
		let set: NamedBuildingScheduleType = {
			title: 'Hours',
			closedForChapelTime: true,
			hours: [{days: ['Mo'], from: '8:00am', to: '10:05am'}],
		}

		expect(findChapelPause(set, at('2026-09-07', '10:00:00'))).toBeNull()
	})

	it('stays quiet when the set is not open yet', () => {
		let set: NamedBuildingScheduleType = {
			title: 'Hours',
			closedForChapelTime: true,
			hours: [{days: ['Mo'], from: '10:30am', to: '5:00pm'}],
		}

		expect(findChapelPause(set, at('2026-09-07', '10:05:00'))).toBeNull()
	})
})
