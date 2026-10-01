import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

import {FilterToolbar} from '../filter-toolbar'
import type {Filter, ListFilterOption} from '../types'

type Item = {isVegetarian: boolean; dietaryTags: string[]}

let TOGGLE_FILTER: Filter<Item> = {
	type: 'toggle',
	key: 'vegetarian',
	enabled: true,
	spec: {label: 'Vegetarian only', title: 'Vegetarian'},
	apply: {key: 'isVegetarian'},
}

let LIST_FILTER_WITH_SELECTION: Filter<Item> = {
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

// Neither `FilterMenu` nor `FilterSheet` renders a summary chip for an empty
// OR-mode selection -- this fixture is what would catch a regression that
// added one back.
let LIST_FILTER_WITH_NO_SELECTION: Filter<Item> = {
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

function manyOptions(count: number): ListFilterOption[] {
	return Array.from({length: count}, (_, i) => ({title: `Dept ${i}`}))
}

// 8 options crosses `filterShape`'s sheet threshold -- the shape whose
// trigger is still a plain button rather than a `Menu`'s own label.
let SHEET_FILTER: Filter<Item> = {
	type: 'list',
	key: 'departments',
	enabled: true,
	spec: {
		title: 'Departments',
		options: manyOptions(8),
		selected: [],
		mode: 'OR',
		displayTitle: true,
	},
	apply: {key: 'dietaryTags'},
}

describe('FilterToolbar', () => {
	test('renders every filter that has something to offer', async () => {
		await render(
			<FilterToolbar
				filters={[
					TOGGLE_FILTER,
					LIST_FILTER_WITH_SELECTION,
					LIST_FILTER_WITH_NO_SELECTION,
					SHEET_FILTER,
				]}
				onChange={jest.fn()}
			/>,
		)

		expect(screen.getByText('Vegetarian')).toBeTruthy()
		expect(screen.getByTestId('menu:Dietary Restrictions')).toBeTruthy()
		expect(screen.getByTestId('menu:Stations')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Departments'})).toBeTruthy()

		// No chip row exists to produce this -- see
		// `LIST_FILTER_WITH_NO_SELECTION`'s comment for why this fixture exists.
		expect(screen.queryByText('No Stations')).toBeNull()
	})
})
