import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'
import moment from 'moment'

import {FilterMenuToolbar} from '../filter-menu-toolbar'
import type {FilterType} from '@frogpond/filter'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
jest.mock('@frogpond/filter/filter-popover', () => ({FilterPopover: () => null}))

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
	test('does not mark the meal picker as an active filter', async () => {
		await render(
			<FilterMenuToolbar
				date={moment('2026-08-30')}
				filters={[MEAL_PICKER]}
				isOpen={false}
				onPopoverDismiss={jest.fn()}
			/>,
		)

		let button = screen.getByRole('button', {name: "Today's Menus"})
		expect(button.props.accessibilityState).toEqual({selected: false})
	})
})
