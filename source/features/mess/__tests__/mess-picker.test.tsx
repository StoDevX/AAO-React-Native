import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen, within} from '@testing-library/react-native'

import {MessPicker} from '../mess-picker'
import type {FilterBranch} from '../lib/filter'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('expo-router', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('../../../testing/expo-router-mock'),
)

const tree: FilterBranch[] = [
	{section: {id: 7, name: 'News', parent: 0}, columns: []},
	{
		section: {id: 23, name: 'Variety', parent: 0},
		columns: [
			{id: 63, name: 'Comic', parent: 23},
			{id: 69, name: 'Poetry', parent: 23},
		],
	},
]

async function renderPicker(selected: string | null) {
	let onSelect = jest.fn<(name: string | null) => void>()
	await render(<MessPicker onSelect={onSelect} selected={selected} tree={tree} />)
	return onSelect
}

describe('MessPicker', () => {
	test('a section without columns is a plain choice', async () => {
		let onSelect = await renderPicker(null)

		await fireEvent.press(screen.getByText('News'))

		expect(onSelect).toHaveBeenCalledWith('News')
	})

	test('a section with columns offers the whole section and each column in its own menu', async () => {
		let onSelect = await renderPicker(null)
		let variety = within(screen.getByTestId('menu:Variety'))

		await fireEvent.press(variety.getByText('All Variety'))
		await fireEvent.press(variety.getByText('Poetry'))

		expect(onSelect.mock.calls).toStrictEqual([['Variety'], ['Poetry']])
	})

	test('checks the chosen column', async () => {
		await renderPicker('Poetry')

		// RNTL matches `checked` only on checkbox, radio and switch roles; a menu item carries it too.
		let checked = screen
			.getAllByRole('menuitem')
			.filter((item) => item.props.accessibilityState?.checked === true)
		expect(checked.map((item) => within(item).queryByText('Poetry') !== null)).toStrictEqual([true])
	})

	test('choosing the chosen column again shows every story', async () => {
		let onSelect = await renderPicker('Poetry')

		await fireEvent.press(screen.getByText('Poetry'))

		expect(onSelect).toHaveBeenCalledWith(null)
	})

	test('All Stories shows every story', async () => {
		let onSelect = await renderPicker('Poetry')

		await fireEvent.press(screen.getByText('All Stories'))

		expect(onSelect).toHaveBeenCalledWith(null)
	})
})
