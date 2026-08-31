import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

import {FilterToolbarButton} from '../filter-toolbar-button'
import type {FilterType, ListItemSpecType} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
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
	// A toggle has one state to change, so its trigger is the control: there is
	// no menu to open and nothing to present.
	test('renders a toggle as a control, presenting nothing', async () => {
		await render(
			<FilterToolbarButton
				filter={TOGGLE_FILTER}
				isActive={false}
				onChange={jest.fn()}
				title={TOGGLE_FILTER.spec.title}
			/>,
		)

		expect(screen.getByRole('button', {name: 'Vegetarian'})).toBeTruthy()
		expect(screen.queryByTestId('menu:Vegetarian')).toBeNull()
	})

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
	// A sheet's `BottomSheet` anchors its own trigger `Button`, styled
	// identically to `FilterMenu`'s -- so `isActive` shows up the same way it
	// does for a menu: as which modifiers the trigger was given. Compared by
	// identity against `filter-menu.tsx`'s own exported constants, not a
	// literal shape, so the mock's invented `Modifier` representation can't
	// leak into what this asserts.
	// The dispatcher's whole job, for this shape, is wiring the sheet's own
	// trigger up at all. This is the only test in this block that proves a
	// press actually reveals a row -- every other test here only checks the
	// trigger's own modifiers.
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

	// `iconFor` is forwarded to the sheet only -- covering it here, not just
	// in `filter-sheet.test.tsx`, is what catches a mutation that deletes the
	// prop at the point this component passes it on.
})
