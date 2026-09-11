import {describe, expect, it} from '@jest/globals'
import {isBuildingOpen} from '../is-building-open'
import {dayMoment, plainMoment} from './moment.helper'
import {BuildingType, DayOfWeekEnumType} from '../../types'

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

	expect(isBuildingOpen(building, m)).toBe(true)
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

	expect(isBuildingOpen(building, m)).toBe(true)
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

	expect(isBuildingOpen(building, m)).toBe(true)
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

	expect(isBuildingOpen(building, m)).toBe(false)
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

	expect(isBuildingOpen(building, m)).toBe(false)
})

// A schedule's `days` name the day its window *opens*, so a window that opened
// last night is still the one running after midnight. 2026-09-11 is a Friday.
const lateNight = (days: DayOfWeekEnumType[]): BuildingType => ({
	name: 'building',
	category: '???',
	breakSchedule: undefined,
	schedule: [{title: 'Hours', hours: [{days, from: '9:00pm', to: '2:00am'}]}],
})

const at = (date: string) => plainMoment(`${date}T01:00:00`, 'YYYY-MM-DD[T]HH:mm:ss')

describe('a Friday-night schedule closing at 2:00am', () => {
	let building = lateNight(['Fr'])

	it('is closed early Friday, before its own window opens', () => {
		expect(isBuildingOpen(building, at('2026-09-11'))).toBe(false)
	})

	it('is open early Saturday, while Friday night runs on', () => {
		expect(isBuildingOpen(building, at('2026-09-12'))).toBe(true)
	})
})

describe('a Friday- and Saturday-night schedule closing at 2:00am', () => {
	let building = lateNight(['Fr', 'Sa'])

	it('is closed early Friday', () => {
		expect(isBuildingOpen(building, at('2026-09-11'))).toBe(false)
	})

	it('is open early Saturday', () => {
		expect(isBuildingOpen(building, at('2026-09-12'))).toBe(true)
	})

	it('is open early Sunday, while Saturday night runs on', () => {
		expect(isBuildingOpen(building, at('2026-09-13'))).toBe(true)
	})

	it('is closed early Monday', () => {
		expect(isBuildingOpen(building, at('2026-09-14'))).toBe(false)
	})
})
