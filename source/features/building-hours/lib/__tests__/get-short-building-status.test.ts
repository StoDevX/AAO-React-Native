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

	it('reads Almost Closed in the last half hour of the carried-over window', () => {
		expect(getShortBuildingStatus(building, at('2026-09-13', '01:45:00'))).toBe('Almost Closed')
	})
})

describe('the chapel badge', () => {
	let at = (date: string, time: string) => plainMoment(`${date}T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

	// data/building-hours/3-1-post-office.yaml
	let postOffice: BuildingType = {
		name: 'Post Office',
		category: '???',
		breakSchedule: undefined,
		schedule: [
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		],
	}

	// data/building-hours/7-2-health-services.yaml
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

	it('reads Chapel in the minutes before chapel shuts the building', () => {
		// The dot has to turn with the text, or the row reads "Chapel in 5 min"
		// beside a green Open dot.
		expect(getShortBuildingStatus(postOffice, at('2026-09-07', '10:05:00'))).toBe('Chapel')
	})

	it('reads Chapel when the building resumes as chapel ends', () => {
		expect(getShortBuildingStatus(postOffice, at('2026-09-07', '10:15:00'))).toBe('Chapel')
	})

	it('reads Closed when the window dies mid-chapel', () => {
		// Not "Closes in 15 minutes": the building is shut, not closing soon.
		expect(getShortBuildingStatus(healthServices, at('2026-09-10', '11:15:00'))).toBe('Closed')
	})

	it('reads Closed when the building is in its own gap during chapel', () => {
		expect(getShortBuildingStatus(healthServices, at('2026-09-10', '12:00:00'))).toBe('Closed')
	})

	it('reads Open once chapel has let out', () => {
		expect(getShortBuildingStatus(postOffice, at('2026-09-07', '10:35:00'))).toBe('Open')
	})
})
