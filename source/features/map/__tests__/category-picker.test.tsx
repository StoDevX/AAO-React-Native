import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {CATEGORY_LABELS, CategoryPicker} from '../category-picker'

jest.mock('@react-native-segmented-control/segmented-control', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('./segmented-control-mock') as typeof import('./segmented-control-mock')
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
