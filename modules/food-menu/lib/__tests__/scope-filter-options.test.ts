import {describe, expect, test} from '@jest/globals'
import type {Filter, ListFilter} from '@frogpond/filter/types'

import {scopeFilterOptions} from '../scope-filter-options'
import type {MenuItemType} from '../../types'

function item(station: string, corIcon: Record<string, string> = {}): MenuItemType {
	return {
		connector: '',
		cor_icon: corIcon,
		description: '',
		id: '1',
		label: 'Black Beans',
		monotony: {} as MenuItemType['monotony'],
		nutrition: {} as MenuItemType['nutrition'],
		nutrition_link: '',
		options: [],
		price: '',
		rating: '',
		special: false,
		station,
		sub_station: '',
		sub_station_id: '',
		sub_station_order: '',
		zero_entree: '',
	}
}

function stationsFilter(options: string[], selected: string[] = []): ListFilter<MenuItemType> {
	return {
		type: 'list',
		key: 'stations',
		enabled: selected.length > 0,
		spec: {
			title: 'Stations',
			options: options.map((title) => ({title})),
			mode: 'OR',
			selected: selected.map((title) => ({title})),
			displayTitle: true,
		},
		apply: {key: 'station'},
	}
}

function dietaryFilter(options: string[]): ListFilter<MenuItemType> {
	return {
		type: 'list',
		key: 'dietary-restrictions',
		enabled: false,
		spec: {
			title: 'Dietary Restrictions',
			options: options.map((title) => ({title})),
			mode: 'AND',
			selected: [],
			displayTitle: true,
		},
		apply: {key: 'cor_icon'},
	}
}

function optionTitles(filter: Filter<MenuItemType> | undefined): string[] {
	return filter?.type === 'list' ? filter.spec.options.map((o) => o.title) : []
}

describe('scopeFilterOptions', () => {
	test('drops a station no item in the meal belongs to', () => {
		let [stations] = scopeFilterOptions([stationsFilter(['Grill', 'Salad Bar'])], [item('Grill')])
		expect(optionTitles(stations)).toEqual(['Grill'])
	})

	test('drops a dietary mark no item in the meal carries', () => {
		let [dietary] = scopeFilterOptions(
			[dietaryFilter(['Vegan', 'Gluten Free'])],
			[item('Grill', {'1': 'Vegan'})],
		)
		expect(optionTitles(dietary)).toEqual(['Vegan'])
	})

	test('keeps Vegetarian when the meal has only vegan food', () => {
		let [dietary] = scopeFilterOptions(
			[dietaryFilter(['Vegetarian'])],
			[item('Grill', {'1': 'Vegan'})],
		)
		expect(optionTitles(dietary)).toEqual(['Vegetarian'])
	})

	test('turns a list filter off when its only selection is not in this meal', () => {
		let [stations] = scopeFilterOptions(
			[stationsFilter(['Grill', 'Salad Bar'], ['Salad Bar'])],
			[item('Grill')],
		)
		expect(stations?.enabled).toBe(false)
		expect(stations?.type === 'list' && stations.spec.selected).toEqual([])
	})

	test('keeps the selections that are in this meal', () => {
		let [stations] = scopeFilterOptions(
			[stationsFilter(['Grill', 'Salad Bar'], ['Grill', 'Salad Bar'])],
			[item('Grill')],
		)
		expect(stations?.enabled).toBe(true)
		expect(stations?.type === 'list' && stations.spec.selected).toEqual([{title: 'Grill'}])
	})

	test('leaves filters that are not lists alone', () => {
		let toggle = {
			type: 'toggle',
			key: 'specials',
			enabled: true,
			spec: {title: 'Specials Only', label: 'Only Show Specials'},
			apply: {key: 'special'},
		} as Filter<MenuItemType>
		expect(scopeFilterOptions([toggle], [item('Grill')])).toEqual([toggle])
	})
})
