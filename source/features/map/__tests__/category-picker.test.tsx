import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {CATEGORY_LABELS, CategoryPicker} from '../category-picker'

jest.mock('@expo/ui/swift-ui', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

describe('CategoryPicker', () => {
	it('renders all configured category labels', async () => {
		await render(<CategoryPicker onChange={jest.fn()} selected="Buildings" />)
		for (let label of CATEGORY_LABELS) {
			expect(screen.getByText(label)).toBeTruthy()
		}
	})

	it('calls onChange with the chosen label when a segment is pressed', async () => {
		let onChange = jest.fn()
		await render(<CategoryPicker onChange={onChange} selected="Buildings" />)
		await fireEvent.press(screen.getByText('Outdoors'))
		expect(onChange).toHaveBeenCalledWith('Outdoors')
	})
})
