import {describe, expect, test} from '@jest/globals'
import type {FilterType} from '@frogpond/filter'

import {offerSpecials} from '../offer-specials'
import type {MenuItemType} from '../../types'

function specials(enabled: boolean): FilterType<MenuItemType> {
	return {
		type: 'toggle',
		key: 'specials',
		enabled,
		spec: {title: 'Specials Only', label: 'Only Show Specials'},
		apply: {key: 'special'},
	} as FilterType<MenuItemType>
}

function stations(): FilterType<MenuItemType> {
	return {
		type: 'list',
		key: 'stations',
		enabled: true,
		spec: {
			title: 'Stations',
			options: [{title: 'Grill'}],
			selected: [{title: 'Grill'}],
			mode: 'OR',
			displayTitle: true,
		},
		apply: {key: 'station'},
	} as FilterType<MenuItemType>
}

describe('offerSpecials', () => {
	test('leaves every filter alone when the meal has specials', () => {
		let filters = [specials(true), stations()]
		expect(offerSpecials(filters, true)).toBe(filters)
	})

	// A meal with no specials has nothing the filter can match, so leaving it
	// on renders an empty screen.
	test('forces the toggle off when the meal has none', () => {
		let [toggle] = offerSpecials([specials(true)], false)
		expect(toggle?.enabled).toBe(false)
	})

	test('keeps the toggle in the toolbar, disabled, rather than dropping it', () => {
		let [toggle] = offerSpecials([specials(true)], false)
		expect(toggle?.key).toBe('specials')
		expect(toggle?.disabled).toBe(true)
	})

	test('leaves the other filters untouched', () => {
		let result = offerSpecials([specials(true), stations()], false)
		expect(result[1]).toEqual(stations())
	})
})
