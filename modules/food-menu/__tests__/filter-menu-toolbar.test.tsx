import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'
import moment from 'moment'

import {FilterMenuToolbar} from '../filter-menu-toolbar'
import type {FilterType} from '@frogpond/filter'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
// `@frogpond/filter`'s barrel still reaches the popover's SwiftUI picker,
// which cannot mount under Jest.
jest.mock('@expo/ui/community/picker', () => ({Picker: 'Picker'}))
jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

type Item = {label: string}

let MEAL_PICKER: FilterType<Item> = {
	type: 'picker',
	key: 'meals',
	enabled: true,
	spec: {
		title: "Today's Menus",
		options: [{label: 'Breakfast'}, {label: 'Lunch'}, {label: 'Dinner'}],
		selected: {label: 'Lunch'},
	},
	apply: {key: 'label'},
}

describe('FilterMenuToolbar', () => {
	// The meal picker is a `picker` filter, which `filterShape` only ever
	// renders as a native `Menu` -- its `label` prop is its own trigger, so
	// there is no separate button here the way the popover once had.
	// `FilterMenuToolbar` still hardcodes `isActive={false}` for it (choosing
	// a meal isn't "narrowing" the way an enabled filter is), which now shows
	// up as the `Menu`'s own `bordered` style rather than a separate button's.
	test('renders the meal picker as an inactive-styled menu, with no separate button', async () => {
		await render(
			<FilterMenuToolbar
				date={moment('2026-08-30')}
				filters={[MEAL_PICKER]}
				isOpen={false}
				onPopoverDismiss={jest.fn()}
			/>,
		)

		expect(screen.queryByRole('button')).toBeNull()
		expect(screen.getByTestId("menu:Today's Menus").props.modifiers).toEqual([
			{$type: 'buttonStyle', value: 'bordered'},
		])
	})
})
