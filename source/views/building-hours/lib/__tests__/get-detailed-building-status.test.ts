import {expect, it} from '@jest/globals'
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
