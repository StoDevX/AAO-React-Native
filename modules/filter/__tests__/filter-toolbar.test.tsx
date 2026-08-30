import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

import {FilterToolbar} from '../filter-toolbar'
import type {FilterType} from '../types'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
jest.mock('../filter-popover', () => ({FilterPopover: () => null}))

type Item = {isVegetarian: boolean; dietaryTags: string[]}

let TOGGLE_FILTER: FilterType<Item> = {
	type: 'toggle',
	key: 'vegetarian',
	enabled: true,
	spec: {label: 'Vegetarian only', title: 'Vegetarian'},
	apply: {key: 'isVegetarian'},
}

let LIST_FILTER_WITH_SELECTION: FilterType<Item> = {
	type: 'list',
	key: 'dietary',
	enabled: true,
	spec: {
		title: 'Dietary Restrictions',
		options: [{title: 'Vegan'}, {title: 'Gluten-Free'}],
		selected: [{title: 'Vegan'}],
		mode: 'OR',
		displayTitle: true,
	},
	apply: {key: 'dietaryTags'},
}

let LIST_FILTER_WITH_NO_SELECTION: FilterType<Item> = {
	type: 'list',
	key: 'stations',
	enabled: true,
	spec: {
		title: 'Stations',
		options: [{title: 'Grill'}],
		selected: [],
		mode: 'OR',
		displayTitle: true,
	},
	apply: {key: 'dietaryTags'},
}

let INACTIVE_FILTER: FilterType<Item> = {
	type: 'toggle',
	key: 'specials',
	enabled: false,
	spec: {label: 'Specials only', title: 'Specials'},
	apply: {key: 'isVegetarian'},
}

describe('FilterToolbar', () => {
	test('renders one button per filter, and no separate active-filter row', async () => {
		await render(
			<FilterToolbar
				filters={[
					TOGGLE_FILTER,
					LIST_FILTER_WITH_SELECTION,
					LIST_FILTER_WITH_NO_SELECTION,
					INACTIVE_FILTER,
				]}
				onPopoverDismiss={jest.fn()}
			/>,
		)

		expect(screen.getByRole('button', {name: 'Vegetarian'})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Dietary Restrictions'})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Stations'})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Specials'})).toBeTruthy()

		// the removed active-filter row used to render these as separate chips
		expect(screen.queryByText('Vegetarian only')).toBeNull()
		expect(screen.queryByText('Vegan')).toBeNull()
		expect(screen.queryByText('No Stations')).toBeNull()
	})

	test('marks each button active or inactive based on filter.enabled', async () => {
		await render(
			<FilterToolbar filters={[TOGGLE_FILTER, INACTIVE_FILTER]} onPopoverDismiss={jest.fn()} />,
		)

		expect(screen.getByRole('button', {name: 'Vegetarian'}).props.accessibilityState).toEqual({
			selected: true,
		})
		expect(screen.getByRole('button', {name: 'Specials'}).props.accessibilityState).toEqual({
			selected: false,
		})
	})
})
