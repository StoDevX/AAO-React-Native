import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

import {FilterToolbarButton} from '../filter-toolbar-button'
import type {FilterType} from '../types'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
jest.mock('../filter-popover', () => ({FilterPopover: () => null}))

type Item = {isVegetarian: boolean}

let FILTER: FilterType<Item> = {
	type: 'toggle',
	key: 'vegetarian',
	enabled: false,
	spec: {label: 'Vegetarian only', title: 'Vegetarian'},
	apply: {key: 'isVegetarian'},
}

describe('FilterToolbarButton', () => {
	test('marks itself unselected when isActive is false', async () => {
		await render(
			<FilterToolbarButton
				filter={FILTER}
				isActive={false}
				onPopoverDismiss={jest.fn()}
				title={FILTER.spec.title}
			/>,
		)

		let button = screen.getByRole('button', {name: 'Vegetarian'})
		expect(button.props.accessibilityState).toEqual({selected: false})
	})

	test('marks itself selected when isActive is true', async () => {
		await render(
			<FilterToolbarButton
				filter={{...FILTER, enabled: true}}
				isActive={true}
				onPopoverDismiss={jest.fn()}
				title={FILTER.spec.title}
			/>,
		)

		let button = screen.getByRole('button', {name: 'Vegetarian'})
		expect(button.props.accessibilityState).toEqual({selected: true})
	})
})
