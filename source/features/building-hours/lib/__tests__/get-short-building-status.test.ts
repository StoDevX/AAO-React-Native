import {describe, expect, it} from '@jest/globals'
import {getShortBuildingStatus} from '../get-short-status'
import {dayMoment, plainMoment} from './moment.helper'
import {BuildingType} from '../../types'

it('checks a list of schedules to see if any are open', () => {
	let m = dayMoment('Fri 1:00pm')
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

	expect(getShortBuildingStatus(building, m)).toBe('Open')
})

it('handles multiple internal schedules for the same timeframe', () => {
	let m = dayMoment('Mon 1:00pm')
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

	expect(getShortBuildingStatus(building, m)).toBe('Open')
})

it('handles multiple named schedules for the same timeframe', () => {
	let m = dayMoment('Mon 1:00pm')
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

	expect(getShortBuildingStatus(building, m)).toBe('Open')
})

it('returns false if none are available for this day', () => {
	let m = dayMoment('Sun 1:00pm')
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

	expect(getShortBuildingStatus(building, m)).toBe('Closed')
})

it('returns false if none are open', () => {
	let m = dayMoment('Mon 3:00pm')
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

	expect(getShortBuildingStatus(building, m)).toBe('Closed')
})

describe('a schedule running past midnight', () => {
	// 2026-09-11 is a Friday.
	let building: BuildingType = {
		name: 'building',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				hours: [{days: ['Fr', 'Sa'], from: '9:00pm', to: '2:00am'}],
			},
		],
	}

	let at = (date: string, time: string) => plainMoment(`${date}T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

	it('is Open early Sunday, while Saturday night runs on', () => {
		expect(getShortBuildingStatus(building, at('2026-09-13', '01:00:00'))).toBe('Open')
	})

	it('is Closed early Friday, before its own window opens', () => {
		expect(getShortBuildingStatus(building, at('2026-09-11', '01:00:00'))).toBe('Closed')
	})

	it('counts down to the close carried over from last night', () => {
		expect(getShortBuildingStatus(building, at('2026-09-13', '01:45:00'))).toBe(
			'Closes in 15 minutes',
		)
	})
})
