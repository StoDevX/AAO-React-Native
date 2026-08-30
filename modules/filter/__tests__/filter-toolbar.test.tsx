import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

import {FilterToolbar} from '../filter-toolbar'
import type {FilterType, ListItemSpecType} from '../types'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

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

let EMPTY_LIST_FILTER: FilterType<Item> = {
	type: 'list',
	key: 'empty',
	enabled: false,
	spec: {title: 'Nothing To Choose', options: [], selected: [], mode: 'OR', displayTitle: true},
	apply: {key: 'dietaryTags'},
}

function manyOptions(count: number): ListItemSpecType[] {
	return Array.from({length: count}, (_, i) => ({title: `Dept ${i}`}))
}

// 12 options crosses `filterShape`'s sheet threshold -- the one shape whose
// trigger is still a plain button, since a `Menu`'s `label` prop is its own
// trigger and has no `isActive`-driven marking of its own.
let SHEET_FILTER: FilterType<Item> = {
	type: 'list',
	key: 'departments',
	enabled: true,
	spec: {
		title: 'Departments',
		options: manyOptions(12),
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
				filters={[TOGGLE_FILTER, LIST_FILTER_WITH_SELECTION, SHEET_FILTER]}
				onPopoverDismiss={jest.fn()}
			/>,
		)

		expect(screen.getByText('Vegetarian')).toBeTruthy()
		expect(screen.getByText('Dietary Restrictions')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Departments'})).toBeTruthy()
	})

	test('renders nothing for a list filter with no options', async () => {
		await render(
			<FilterToolbar filters={[TOGGLE_FILTER, EMPTY_LIST_FILTER]} onPopoverDismiss={jest.fn()} />,
		)

		expect(screen.getByText('Vegetarian')).toBeTruthy()
		expect(screen.queryByText('Nothing To Choose')).toBeNull()
	})

	// This is observable only for a sheet-shaped filter -- a `Menu`'s own
	// label trigger, which every other fixture above renders as, has no
	// `isActive`-driven state at all to assert on.
	test('threads filter.enabled into a sheet trigger as isActive', async () => {
		await render(<FilterToolbar filters={[SHEET_FILTER]} onPopoverDismiss={jest.fn()} />)

		expect(screen.getByRole('button', {name: 'Departments'}).props.accessibilityState).toEqual({
			selected: true,
		})
	})
})
