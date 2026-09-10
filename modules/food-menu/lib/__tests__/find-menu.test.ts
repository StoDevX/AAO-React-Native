import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {findMeal, findMenu} from '../find-menu'
import type {DayPartMenuType, ProcessedMealType, StationMenuType} from '../../types'

const TIMEZONE = 'America/Chicago'

function at(time: string): moment.Moment {
	return moment.tz(`2026-08-17T${time}`, TIMEZONE)
}

function station(label: string): StationMenuType {
	return {order_id: '0', id: label, label, price: '', note: '', soup: false, items: []}
}

function meal(label: string, starttime: string, endtime: string): ProcessedMealType {
	return {label, starttime, endtime, stations: [station(label)]}
}

function daypart(label: string, starttime: string, endtime: string): DayPartMenuType {
	return {...meal(label, starttime, endtime), id: label, abbreviation: label}
}

describe('findMenu', () => {
	test('has no menu to give when the collection is empty', () => {
		expect(findMenu([], at('12:00:00'))).toBeUndefined()
	})

	// The outer array is a collection of days; a day carrying no menus at all is
	// what a closed cafe answers with.
	test('has no menu to give when the day carries none', () => {
		expect(findMenu([[]], at('12:00:00'))).toBeUndefined()
	})

	test('picks the daypart being served', () => {
		let dayparts = [[daypart('Breakfast', '7:00', '11:00'), daypart('Lunch', '11:00', '14:00')]]

		expect(findMenu(dayparts, at('12:00:00'))?.label).toBe('Lunch')
	})
})

describe('findMeal', () => {
	test('has no meal to give when there are none', () => {
		expect(findMeal([], at('12:00:00'))).toBeUndefined()
	})

	// A cafe serving one menu all day -- the Cage, the Pause -- takes it without
	// consulting the clock, which is why an hour it cannot parse never mattered
	// there.
	test('takes a lone meal without reading its hours', () => {
		let meals = [meal('Menu', 'not a time', 'nor is this')]

		expect(findMeal(meals, at('08:00:00'))?.label).toBe('Menu')
	})

	test('reads an hour whether or not it is zero-padded', () => {
		let padded = [meal('Breakfast', '07:15', '09:45'), meal('Lunch', '10:30', '14:00')]
		let bare = [meal('Breakfast', '7:15', '9:45'), meal('Lunch', '10:30', '14:00')]

		expect(findMeal(padded, at('08:00:00'))?.label).toBe('Breakfast')
		expect(findMeal(bare, at('08:00:00'))?.label).toBe('Breakfast')
	})

	/**
	 * An hour that will not parse is skipped rather than raised, so the meal it
	 * belongs to can never be chosen and the reader silently gets a later one.
	 * This is how a menu can look wrong with nothing having gone visibly wrong,
	 * and it is what made a padded hour a bug rather than an error.
	 */
	test('skips a meal whose hours will not parse, and says nothing about it', () => {
		let meals = [
			meal('Breakfast', 'oops', 'nope'),
			meal('Lunch', '11:00', '14:00'),
			meal('Dinner', '17:00', '20:00'),
		]

		expect(findMeal(meals, at('08:00:00'))?.label).toBe('Lunch')
	})

	test('falls to the last meal when no hours parse at all', () => {
		let meals = [meal('Breakfast', 'oops', 'nope'), meal('Lunch', 'also', 'bad')]

		expect(findMeal(meals, at('08:00:00'))?.label).toBe('Lunch')
	})
})
