import {describe, expect, it, jest} from '@jest/globals'
import {getDetailedBuildingStatus} from '../get-detailed-status'
import {plainMoment} from './moment.helper'
import {BuildingType} from '../../types'

it('returns a list of [isOpen, scheduleName, verboseStatus] tuples', () => {
	jest.useFakeTimers().setSystemTime(new Date('2018-06-23T13:00:00Z').getTime())

	let m = plainMoment('06-23-2018 1:00pm', 'MM-DD-YYYY h:mma')
	let building: BuildingType = {
		name: 'building',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
					{days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
					{days: ['Su'], from: '10:30am', to: '12:00am'},
				],
			},
		],
	}

	let actual = getDetailedBuildingStatus(building, m)

	expect(actual).toBeInstanceOf(Array)
	expect(actual.length).toEqual(1)
	expect(typeof actual[0].isActive).toBe('boolean')
	expect(typeof actual[0].label).toBe('string')
	expect(typeof actual[0].status).toBe('string')
	expect(actual[0].status).toBe('10:30 AM — 2:00 AM')

	jest.useRealTimers()
})

it('checks a list of schedules to see if any are open', () => {
	jest.useFakeTimers().setSystemTime(new Date('2018-06-23T13:00:00Z').getTime())

	let m = plainMoment('06-23-2018 1:00pm', 'MM-DD-YYYY h:mma')
	let building: BuildingType = {
		name: 'building',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
					{days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
					{days: ['Su'], from: '10:30am', to: '12:00am'},
				],
			},
		],
	}

	let actual = getDetailedBuildingStatus(building, m)
	expect(actual[0].status).toBe('10:30 AM — 2:00 AM')
	expect(actual[0].isActive).toBe(true)

	jest.useRealTimers()
})

it('handles multiple internal schedules for the same timeframe', () => {
	let m = plainMoment('06-18-2018 1:00pm', 'MM-DD-YYYY h:mma')
	let building: BuildingType = {
		name: 'building',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				hours: [
					{days: ['Mo'], from: '10:30am', to: '12:00pm'},
					{days: ['Mo'], from: '1:00pm', to: '3:00pm'},
				],
			},
		],
	}

	let actual = getDetailedBuildingStatus(building, m)
	expect(actual).toMatchSnapshot()

	expect(actual[0].isActive).toBe(false)
	expect(actual[1].isActive).toBe(true)
})

it('handles multiple named schedules for the same timeframe', () => {
	let m = plainMoment('06-18-2018 1:00pm', 'MM-DD-YYYY h:mma')
	let building: BuildingType = {
		name: 'building',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				hours: [{days: ['Mo'], from: '10:30am', to: '12:00pm'}],
			},
			{
				title: 'Hours2',
				hours: [
					{days: ['Mo'], from: '10:30am', to: '12:00pm'},
					{days: ['Mo'], from: '1:00pm', to: '3:00pm'},
				],
			},
		],
	}

	let actual = getDetailedBuildingStatus(building, m)
	expect(actual).toMatchSnapshot()

	expect(actual[0].isActive).toBe(false)
	expect(actual[1].isActive).toBe(false)
	expect(actual[2].isActive).toBe(true)
})

it('returns false if none are available for this day', () => {
	let m = plainMoment('06-17-2018 1:00pm', 'MM-DD-YYYY h:mma')
	let building: BuildingType = {
		name: 'building',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '12:00am'},
					{days: ['Fr', 'Sa'], from: '10:30am', to: '2:00am'},
				],
			},
		],
	}

	let actual = getDetailedBuildingStatus(building, m)
	expect(actual).toMatchSnapshot()

	expect(actual[0].isActive).toBe(false)
})

it('returns false if none are open', () => {
	let m = plainMoment('06-19-2018 3:00pm', 'MM-DD-YYYY h:mma')
	let building: BuildingType = {
		name: 'building',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th'], from: '10:30am', to: '2:00pm'},
					{days: ['Fr', 'Sa'], from: '10:30am', to: '2:00pm'},
				],
			},
		],
	}

	let actual = getDetailedBuildingStatus(building, m)
	expect(actual).toMatchSnapshot()

	expect(actual[0].isActive).toBe(false)
})

describe('a window still running from last night', () => {
	// data/building-hours/8-bc.yaml: Buntrock runs to 1am on Friday and
	// Saturday nights. 2026-09-13 is a Sunday.
	let buntrock: BuildingType = {
		name: 'Buntrock Commons',
		category: 'Academia',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				hours: [
					{days: ['Su', 'Mo', 'Tu', 'We', 'Th'], from: '7:00am', to: '12:00am'},
					{days: ['Fr', 'Sa'], from: '7:00am', to: '1:00am'},
				],
			},
		],
	}

	let at = (time: string) => plainMoment(`2026-09-13T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

	it('is listed, showing the hours it is actually running', () => {
		let actual = getDetailedBuildingStatus(buntrock, at('00:30:00'))
		let running = actual.filter((row) => row.isActive)

		expect(running).toHaveLength(1)
		expect(running[0].status).toBe('7:00 AM — 1:00 AM')
	})

	it('drops off the list once it has closed', () => {
		let actual = getDetailedBuildingStatus(buntrock, at('14:00:00'))

		expect(actual.map((row) => row.status)).toEqual(['7:00 AM — Midnight'])
	})
})

describe('the chapel row', () => {
	let at = (date: string, time: string) => plainMoment(`${date}T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

	let healthServices: BuildingType = {
		name: 'Health Services',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '11:30am'},
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '1:00pm', to: '4:00pm'},
				],
			},
		],
	}

	it('replaces the hours when the building resumes as chapel ends', () => {
		// Monday chapel is 10:10-10:30am, inside the 9:00-11:30am window.
		let actual = getDetailedBuildingStatus(healthServices, at('2026-09-07', '10:15:00'))

		expect(actual).toHaveLength(1)
		expect(actual[0].status).toBe('Closed for chapel: 10:10 AM — 10:30 AM')
		expect(actual[0].isActive).toBe(false)
	})

	it('shows the real hours when the building will not resume', () => {
		// Thursday chapel runs to 12:35pm, long after the 11:30am close.
		let actual = getDetailedBuildingStatus(healthServices, at('2026-09-10', '11:15:00'))

		expect(actual.map((row) => row.status)).toEqual(['9:00 AM — 11:30 AM', '1:00 PM — 4:00 PM'])
		expect(actual.every((row) => !row.isActive)).toBe(true)
	})
})
