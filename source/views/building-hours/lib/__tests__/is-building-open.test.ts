import {expect, it} from '@jest/globals'
import {isBuildingOpen} from '../is-building-open'
import {dayMoment} from './moment.helper'
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
