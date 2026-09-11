import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {FilterMenu} from '../filter-menu'
import type {ListItemSpecType, ListType, PickerType, ToggleType} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})

type Row = {x: string}

function toggleFilter(enabled: boolean): ToggleType<Row> {
	return {
		type: 'toggle',
		key: 'k',
		enabled,
		spec: {label: 'Specials Only', title: 'Specials'},
		apply: {key: 'x'},
	}
}

function pickerFilter(options: {label: string}[]): PickerType<Row> {
	return {
		type: 'picker',
		key: 'k',
		enabled: true,
		spec: {title: 'Level', options},
		apply: {key: 'x'},
	}
}

function listFilter(
	mode: 'AND' | 'OR',
	options: ListItemSpecType[],
	selected: ListItemSpecType[],
): ListType<Row> {
	return {
		type: 'list',
		key: 'k',
		enabled: false,
		spec: {title: 'Stations', options, selected, mode, displayTitle: true},
		apply: {key: 'x'},
	} as ListType<Row>
}

describe('FilterMenu, toggle', () => {
	test('emits enabled flipped', async () => {
		let onChange = jest.fn()
		await render(<FilterMenu filter={toggleFilter(false)} isActive={false} onChange={onChange} />)

		await fireEvent.press(screen.getByText('Specials Only'))

		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({enabled: true}))
	})
})

describe('FilterMenu, picker', () => {
	test('emits the tapped option', async () => {
		let onChange = jest.fn()
		let options = [{label: 'First-year'}, {label: 'Sophomore'}, {label: 'Junior'}]
		await render(<FilterMenu filter={pickerFilter(options)} isActive={false} onChange={onChange} />)

		await fireEvent.press(screen.getByText('Sophomore'))

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({spec: expect.objectContaining({selected: options[1]})}),
		)
	})
})

describe('FilterMenu, list', () => {
	test('tapping an option emits the toggled selection', async () => {
		let onChange = jest.fn()
		let options = [{title: 'A'}, {title: 'B'}, {title: 'C'}]
		await render(
			<FilterMenu
				filter={listFilter('OR', options, [{title: 'A'}])}
				isActive={false}
				onChange={onChange}
			/>,
		)

		await fireEvent.press(screen.getByText('B'))

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				spec: expect.objectContaining({selected: [{title: 'A'}, {title: 'B'}]}),
			}),
		)
	})
})
