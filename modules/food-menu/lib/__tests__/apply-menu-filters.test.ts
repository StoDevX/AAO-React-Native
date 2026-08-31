import {describe, expect, test} from '@jest/globals'

import {applyMenuFilters, meetsDietaryMarks} from '../apply-menu-filters'
import type {MenuItemType} from '../../types'
import type {FilterType, ListType} from '@frogpond/filter/types'

function item(
	corIcon: Record<string, string>,
	overrides: Partial<MenuItemType> = {},
): MenuItemType {
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
		station: 'Home',
		sub_station: '',
		sub_station_id: '',
		sub_station_order: '',
		tier3: false,
		zero_entree: '',
		...overrides,
	}
}

function dietaryFilter(titles: string[], enabled = true): ListType<MenuItemType> {
	return {
		type: 'list',
		key: 'dietary-restrictions',
		enabled,
		spec: {
			title: 'Dietary Restrictions',
			options: [],
			selected: titles.map((title) => ({title})),
			mode: 'AND',
			displayTitle: true,
		},
		apply: {key: 'cor_icon'},
	}
}

const VEGAN = {4: 'Vegan'}
const VEGETARIAN = {1: 'Vegetarian'}
const VEGAN_NO_GLUTEN = {4: 'Vegan', 9: 'Made without Gluten-Containing Ingredients'}

describe('meetsDietaryMarks', () => {
	// The cafe tags a dish Vegan or Vegetarian, never both, so a vegan dish would
	// otherwise vanish from a vegetarian's filtered menu.
	test('a vegan dish satisfies a vegetarian filter', () => {
		expect(meetsDietaryMarks([{title: 'Vegetarian'}], VEGAN)).toBe(true)
	})

	// The other direction does not hold: a vegetarian dish may carry dairy.
	test('a vegetarian dish does not satisfy a vegan filter', () => {
		expect(meetsDietaryMarks([{title: 'Vegan'}], VEGETARIAN)).toBe(false)
	})

	test('a dish carrying the mark asked for satisfies it directly', () => {
		expect(meetsDietaryMarks([{title: 'Vegetarian'}], VEGETARIAN)).toBe(true)
	})

	test('every mark asked for still has to be met', () => {
		let asked = [{title: 'Vegetarian'}, {title: 'Made without Gluten-Containing Ingredients'}]

		expect(meetsDietaryMarks(asked, VEGAN_NO_GLUTEN)).toBe(true)
		expect(meetsDietaryMarks(asked, VEGAN)).toBe(false)
	})

	test('a dish with no marks at all meets nothing', () => {
		expect(meetsDietaryMarks([{title: 'Vegetarian'}], {})).toBe(false)
	})
})

describe('applyMenuFilters', () => {
	test('lets a vegan dish through a vegetarian filter', () => {
		expect(applyMenuFilters([dietaryFilter(['Vegetarian'])], item(VEGAN))).toBe(true)
	})

	test('keeps a dish out when it meets none of the marks', () => {
		expect(applyMenuFilters([dietaryFilter(['Vegetarian'])], item({10: 'Halal'}))).toBe(false)
	})

	test('ignores a dietary filter that is switched off', () => {
		let off = dietaryFilter(['Vegan'], false)

		expect(applyMenuFilters([off], item(VEGETARIAN))).toBe(true)
	})

	// Everything that is not the dietary list keeps the shared behaviour.
	test('still applies the other filters', () => {
		let specials: FilterType<MenuItemType> = {
			type: 'toggle',
			key: 'specials',
			enabled: true,
			spec: {title: 'Specials Only', label: 'Only Show Specials'},
			apply: {key: 'special'},
		}

		expect(applyMenuFilters([specials], item(VEGAN, {special: true}))).toBe(true)
		expect(applyMenuFilters([specials], item(VEGAN, {special: false}))).toBe(false)
	})
})
