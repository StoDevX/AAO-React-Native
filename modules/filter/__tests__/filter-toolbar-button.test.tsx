import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

import {FilterToolbarButton} from '../filter-toolbar-button'
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

// 12 options crosses `filterShape`'s sheet threshold -- the shape whose
// trigger is a plain button rather than a native `Menu`'s own label.
function sheetFilter(enabled: boolean): FilterType<Item> {
	return {
		type: 'list',
		key: 'departments',
		enabled,
		spec: {
			title: 'Departments',
			options: manyOptions(12),
			selected: [],
			mode: 'OR',
			displayTitle: true,
		},
		apply: {key: 'isVegetarian'},
	}
}

describe('FilterToolbarButton, menu shape', () => {
	// A toggle is always `menu`-shaped, and a native `Menu`'s `label` prop is
	// its own trigger -- unlike the popover this replaces, there is no
	// separate button here.
	test('renders as a menu, with no separate trigger button', async () => {
		await render(
			<FilterToolbarButton
				filter={TOGGLE_FILTER}
				isActive={false}
				onPopoverDismiss={jest.fn()}
				title={TOGGLE_FILTER.spec.title}
			/>,
		)

		expect(screen.getByText('Vegetarian')).toBeTruthy()
		expect(screen.queryByRole('button')).toBeNull()
	})

	// `isActive` still reaches the trigger: it drives which `buttonStyle`
	// (and, when active, which accessibility trait) the `Menu` renders with,
	// so a filter that's narrowing something still looks and sounds different
	// from one that isn't -- the menu label is the only trigger there is, so
	// this is where that distinction has to live.
	test('marks itself with the bordered style when isActive is false', async () => {
		await render(
			<FilterToolbarButton
				filter={TOGGLE_FILTER}
				isActive={false}
				onPopoverDismiss={jest.fn()}
				title={TOGGLE_FILTER.spec.title}
			/>,
		)

		let trigger = screen.getByTestId('menu:Vegetarian')
		expect(trigger.props.modifiers).toEqual([{$type: 'buttonStyle', style: 'bordered'}])
	})

	test('marks itself with the borderedProminent style and isSelected trait when isActive is true', async () => {
		await render(
			<FilterToolbarButton
				filter={TOGGLE_FILTER}
				isActive={true}
				onPopoverDismiss={jest.fn()}
				title={TOGGLE_FILTER.spec.title}
			/>,
		)

		let trigger = screen.getByTestId('menu:Vegetarian')
		expect(trigger.props.modifiers).toEqual([
			{$type: 'buttonStyle', style: 'borderedProminent'},
			{$type: 'accessibilityAddTraits', traits: ['isSelected']},
		])
	})
})

describe('FilterToolbarButton, sheet shape', () => {
	// A sheet has no trigger of its own, so this component still renders the
	// same button the popover used to open behind it -- and still marks it
	// active or inactive the way master's popover trigger did.
	test('marks its trigger unselected when isActive is false', async () => {
		await render(
			<FilterToolbarButton
				filter={sheetFilter(false)}
				isActive={false}
				onPopoverDismiss={jest.fn()}
				title="Departments"
			/>,
		)

		let button = screen.getByRole('button', {name: 'Departments'})
		expect(button.props.accessibilityState).toEqual({selected: false})
	})

	test('marks its trigger selected when isActive is true', async () => {
		await render(
			<FilterToolbarButton
				filter={sheetFilter(true)}
				isActive={true}
				onPopoverDismiss={jest.fn()}
				title="Departments"
			/>,
		)

		let button = screen.getByRole('button', {name: 'Departments'})
		expect(button.props.accessibilityState).toEqual({selected: true})
	})
})
