import {describe, expect, test} from '@jest/globals'

import {stationSections} from '../station-sections'
import type {MenuItemType} from '../../types'

function item(label: string, subStation = '', order = ''): MenuItemType {
	return {
		id: label,
		label,
		station: 'Daily Special',
		sub_station: subStation,
		sub_station_order: order,
	} as MenuItemType
}

const titles = (sections: ReturnType<typeof stationSections>) => sections.map((s) => s.title)
const labels = (sections: ReturnType<typeof stationSections>) =>
	sections.map((s) => s.data.map((i) => i.label))

describe('stationSections', () => {
	// The Pause's menu, and every station at Stav that carries only specials.
	test('keeps a station without sub-stations as one section under its name', () => {
		let sections = stationSections('Home', [item('Pot Roast'), item('Green Beans')])

		expect(titles(sections)).toEqual(['Home'])
		expect(labels(sections)).toEqual([['Pot Roast', 'Green Beans']])
	})

	// Bon Appétit files no special under a sub-station, so they stay under the
	// station's own name, ahead of its regular fare.
	test('leads with the items filed under no sub-station, under the station name', () => {
		let sections = stationSections('Daily Special', [
			item('Beef Smash Burger', 'Burgers', '22'),
			item('Poutine'),
		])

		expect(titles(sections)).toEqual(['Daily Special', 'Daily Special • Burgers'])
		expect(labels(sections)).toEqual([['Poutine'], ['Beef Smash Burger']])
	})

	test('orders the sub-stations as the cafe does, not as the items are listed', () => {
		let sections = stationSections('Daily Special', [
			item('Chicken Caesar Salad Wrap', 'Wraps', '21'),
			item('Classic Grilled Cheese', 'Sandwiches', '20'),
			item('Everything Breakfast Bagel', 'Breakfast Sandwiches', '12'),
		])

		expect(titles(sections)).toEqual([
			'Daily Special • Breakfast Sandwiches',
			'Daily Special • Sandwiches',
			'Daily Special • Wraps',
		])
	})

	// Compared as numbers: as strings, `9` would sort after `12`.
	test('orders the sub-stations numerically', () => {
		let sections = stationSections('Daily Special', [
			item('Fried Chicken Tenders', 'Baskets', '12'),
			item('Scone', 'Scones', '9'),
		])

		expect(titles(sections)).toEqual(['Daily Special • Scones', 'Daily Special • Baskets'])
	})

	test('keeps the listed order of the items within a sub-station', () => {
		let sections = stationSections('Daily Special', [
			item('Ole Burger', 'Burgers', '22'),
			item('Beef Smash Burger', 'Burgers', '22'),
		])

		expect(labels(sections)).toEqual([['Ole Burger', 'Beef Smash Burger']])
	})

	test('gives a station with nothing on it no sections', () => {
		expect(stationSections('Home', [])).toEqual([])
	})

	// Stav files something under `Cheese` at three stations, and a heading of
	// `Cheese` alone would not say which.
	test('names a sub-station after its station', () => {
		let [grill] = stationSections('Grill', [item('Cheddar', 'Cheese', '1')])
		let [deli] = stationSections('Deli', [item('Swiss', 'Cheese', '1')])

		expect(grill.title).toBe('Grill • Cheese')
		expect(deli.title).toBe('Deli • Cheese')
	})

	test('says which station each section came from', () => {
		let sections = stationSections('Daily Special', [
			item('Poutine'),
			item('Ole Burger', 'Burgers', '22'),
		])

		expect(sections.map((s) => s.station)).toEqual(['Daily Special', 'Daily Special'])
	})
})
