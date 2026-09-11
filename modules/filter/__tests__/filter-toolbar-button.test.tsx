import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

import {FilterToolbarButton} from '../filter-toolbar-button'
import type {FilterType, ListItemSpecType} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})

type Item = {isVegetarian: boolean}

let TOGGLE_FILTER: FilterType<Item> = {
	type: 'toggle',
	key: 'vegetarian',
	enabled: false,
	spec: {label: 'Vegetarian only', title: 'Vegetarian'},
	apply: {key: 'isVegetarian'},
}

function manyOptions(count: number): ListItemSpecType[] {
	return Array.from({length: count}, (_, i) => ({title: `Dept ${i}`}))
}

// 8 options crosses `filterShape`'s sheet threshold -- the shape whose
// trigger is a plain button rather than a native `Menu`'s own label.
function sheetFilter(enabled: boolean): FilterType<Item> {
	return {
		type: 'list',
		key: 'departments',
		enabled,
		spec: {
			title: 'Departments',
			options: manyOptions(8),
			selected: [],
			mode: 'OR',
			displayTitle: true,
		},
		apply: {key: 'isVegetarian'},
	}
}

describe('FilterToolbarButton, inline shape', () => {
	// The dispatcher's whole job is to wire `onChange` through to whichever
	// presentation it picked. This is the only test that exercises that wiring
	// directly -- every other test in the suite exercises what
	// `FilterMenu`/`FilterSheet` do with it, not whether this component forwards
	// it at all.
	test('forwards a tap through to onChange', async () => {
		let onChange = jest.fn()
		await render(
			<FilterToolbarButton
				filter={TOGGLE_FILTER}
				isActive={false}
				onChange={onChange}
				title={TOGGLE_FILTER.spec.title}
			/>,
		)

		await fireEvent.press(screen.getByRole('button', {name: 'Vegetarian'}))

		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({enabled: true}))
	})
})

describe('FilterToolbarButton, sheet shape', () => {
	// The dispatcher's whole job, for this shape, is wiring the sheet's own
	// trigger up at all: a press has to reveal a row.
	test('pressing the trigger opens the sheet', async () => {
		await render(
			<FilterToolbarButton
				filter={sheetFilter(false)}
				isActive={false}
				onChange={jest.fn()}
				title="Departments"
			/>,
		)

		expect(screen.queryByText('Dept 0')).toBeNull()

		await fireEvent.press(screen.getByRole('button', {name: 'Departments'}))

		expect(screen.getByText('Dept 0')).toBeTruthy()
	})
})
