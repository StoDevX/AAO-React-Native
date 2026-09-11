import {describe, expect, it} from '@jest/globals'
import {findChapelReopen} from '../find-chapel-reopen'
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

// data/building-hours/7-2-health-services.yaml
const healthServices: NamedBuildingScheduleType = {
	title: 'Hours',
	closedForChapelTime: true,
	hours: [
		{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '11:30am'},
		{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '1:00pm', to: '4:00pm'},
	],
}

describe('a window that outlasts chapel', () => {
	it('reopens when chapel ends', () => {
		// Monday chapel is 10:10-10:30am; the post office runs 8-5.
		let reopen = findChapelReopen(postOffice, at('2026-09-07', '10:15:00'))

		expect(reopen?.format('HH:mm')).toBe('10:30')
	})
})

describe('a window that does not outlast chapel', () => {
	it('is null when the window dies mid-chapel', () => {
		// Thursday chapel is 11:00am-12:35pm; health services closes at 11:30am
		// and does not reopen until 1pm.
		expect(findChapelReopen(healthServices, at('2026-09-10', '11:15:00'))).toBeNull()
	})

	it('is null when the window closes exactly as chapel ends', () => {
		// Tuesday chapel is 11:10-11:30am and health services closes at 11:30am,
		// so it never resumes. This is why the comparison is strict.
		expect(findChapelReopen(healthServices, at('2026-09-08', '11:15:00'))).toBeNull()
	})
})

describe('chapel that is not what closed the building', () => {
	it('is null when no window is running', () => {
		// Thursday noon: chapel runs to 12:35 but health services is in its own
		// 11:30-1:00 gap.
		expect(findChapelReopen(healthServices, at('2026-09-10', '12:00:00'))).toBeNull()
	})

	it('is null outside chapel', () => {
		expect(findChapelReopen(postOffice, at('2026-09-07', '14:00:00'))).toBeNull()
	})

	it('is null when the set does not close for chapel', () => {
		let alwaysOpen: NamedBuildingScheduleType = {...postOffice, closedForChapelTime: undefined}

		expect(findChapelReopen(alwaysOpen, at('2026-09-07', '10:15:00'))).toBeNull()
	})

	it('is null for a building that has not opened yet', () => {
		// Opening at 10:30am, exactly when Monday chapel ends. Chapel is not
		// what is keeping it shut at 10:15 -- it simply has not opened -- so
		// this is an ordinary "opens in 15 min", not a chapel closure.
		let opensAsChapelEnds: NamedBuildingScheduleType = {
			title: 'Hours',
			closedForChapelTime: true,
			hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '10:30am', to: '5:00pm'}],
		}

		expect(findChapelReopen(opensAsChapelEnds, at('2026-09-07', '10:15:00'))).toBeNull()
	})
})
