import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'

import type {BuildingType} from '../../building-hours/types'
import type {MenuItemContainerType, MenuItemType, ProcessedMealType} from '../../menus/types'
import {hoursAnswer, openNowLabel, specialsAnswer, UNAVAILABLE_SPECIALS} from '../answers'

/** A Monday on campus, at `time`. */
const monday = (time: string) => moment.tz(`2026-11-02T${time}`, 'America/Chicago')

function item(id: string, label: string, special: boolean): MenuItemType {
	return {id, label, special, station: '', description: ''} as MenuItemType
}

const items: MenuItemContainerType = {
	'1': item('1', 'Scrambled eggs', true),
	'2': item('2', 'Chicken pot pie', true),
	'3': item('3', 'Dinner roll', false),
	'4': item('4', 'Black bean burger', true),
	'5': item('5', 'Sweet potato fries', true),
	'6': item('6', 'Onion rings', true),
}

function station(label: string, ids: string[]) {
	return {label, items: ids, order_id: '', id: label, price: '', note: '', soup: false}
}

const stav: ProcessedMealType[] = [
	{
		label: 'Breakfast',
		starttime: '07:15',
		endtime: '09:45',
		stations: [station('Home Cooking', ['1'])],
	},
	{
		label: 'Lunch',
		starttime: '10:30',
		endtime: '14:00',
		stations: [station('Home Cooking', ['2', '3']), station('Grill', ['4', '5', '6'])],
	},
]

describe('specialsAnswer', () => {
	test('reads the specials of the meal being served, by station', () => {
		expect(specialsAnswer('Stav Hall', stav, items, monday('12:00'))).toBe(
			"Here are today's lunch specials at Stav Hall. At Home Cooking: chicken pot pie. " +
				'At Grill: black bean burger, sweet potato fries and onion rings.',
		)
	})

	test('reads the next meal between meals', () => {
		expect(specialsAnswer('Stav Hall', stav, items, monday('09:50'))).toMatch(
			/^Here are today's lunch specials at Stav Hall\./u,
		)
	})

	test('says there are none after the last meal has ended', () => {
		expect(specialsAnswer('Stav Hall', stav, items, monday('21:00'))).toBe(
			'There are no specials at Stav Hall right now.',
		)
	})

	test('says there are none when the meal has no specials', () => {
		let cage: ProcessedMealType[] = [
			{label: 'Menu', starttime: '0:00', endtime: '23:59', stations: [station('Grill', ['3'])]},
		]
		expect(specialsAnswer('the Cage', cage, items, monday('12:00'))).toBe(
			'There are no specials at the Cage right now.',
		)
	})

	test('reads what the Specials toggle shows: Specials and Additional Favorites, not extras', () => {
		let tiered: MenuItemContainerType = {
			b: {...item('b', 'Cheeseburger', false), tier: 2},
			w: {...item('w', 'Chicken wrap', true), tier: 1},
			k: {...item('k', 'Ketchup', false), tier: 3},
		}
		let cage: ProcessedMealType[] = [
			{
				label: 'Menu',
				starttime: '0:00',
				endtime: '23:59',
				stations: [station('Grill', ['w', 'b', 'k'])],
			},
		]
		expect(specialsAnswer('the Cage', cage, tiered, monday('12:00'))).toBe(
			"Here are today's specials at the Cage. At Grill: chicken wrap and cheeseburger.",
		)
	})

	test("leaves out the name of a hall's only meal, which may be the hall's own", () => {
		let cage: ProcessedMealType[] = [
			{label: 'The Cage', starttime: '0:00', endtime: '23:59', stations: [station('Grill', ['4'])]},
		]
		expect(specialsAnswer('The Cage', cage, items, monday('12:00'))).toBe(
			"Here are today's specials at The Cage. At Grill: black bean burger.",
		)
	})

	test('says there are none when there are no meals', () => {
		expect(specialsAnswer('the Cage', [], items, monday('12:00'))).toBe(
			'There are no specials at the Cage right now.',
		)
	})
})

test('UNAVAILABLE_SPECIALS names the hall', () => {
	expect(UNAVAILABLE_SPECIALS('Stav Hall')).toBe(
		"We're unable to get the specials at Stav Hall right now.",
	)
})

const stavHours: BuildingType = {
	name: 'Stav Hall',
	category: 'Food',
	schedule: [
		{title: 'Breakfast', hours: [{days: ['Mo', 'Tu'], from: '7:15am', to: '9:45am'}]},
		{title: 'Lunch', hours: [{days: ['Mo'], from: '10:30am', to: '2:00pm'}]},
		{title: 'Dinner', hours: [{days: ['Sa'], from: '4:30pm', to: '7:00pm'}]},
	],
}

const libraryHours = {
	title: 'Hours',
	hours: [{days: ['Mo' as const], from: '7:30am', to: '12:00am'}],
}

const library: BuildingType = {
	name: 'Rølvaag Library',
	category: 'Libraries',
	schedule: [libraryHours],
}

describe('hoursAnswer', () => {
	test("names each of today's windows by its set", () => {
		expect(hoursAnswer(stavHours, monday('08:00'))).toBe(
			'Stav Hall is open today for Breakfast from 7:15 a.m. to 9:45 a.m., ' +
				'and Lunch from 10:30 a.m. to 2 p.m.',
		)
	})

	test("leaves a lone set's title out", () => {
		expect(hoursAnswer(library, monday('08:00'))).toBe(
			'Rølvaag Library is open today from 7:30 a.m. to midnight.',
		)
	})

	test('says closed on a day with no window', () => {
		expect(hoursAnswer(library, moment.tz('2026-11-03T08:00', 'America/Chicago'))).toBe(
			'Rølvaag Library is closed today.',
		)
	})

	test('says closed when a break leaves the schedule empty', () => {
		let onBreak: BuildingType = {...library, schedule: [{title: 'Fall Break', hours: []}]}
		expect(hoursAnswer(onBreak, monday('08:00'))).toBe('Rølvaag Library is closed today.')
	})

	test('says closed when the doors are shut', () => {
		let shut: BuildingType = {...library, schedule: [{...libraryHours, isPhysicallyOpen: false}]}
		expect(hoursAnswer(shut, monday('08:00'))).toBe('Rølvaag Library is closed today.')
	})
})

describe('openNowLabel', () => {
	test('says when an open building closes', () => {
		expect(openNowLabel(stavHours, monday('12:00'))).toBe('Stav Hall, open until 2 p.m.')
	})

	test('is null for a shut building', () => {
		expect(openNowLabel(stavHours, monday('15:00'))).toBeNull()
	})
})
