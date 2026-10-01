import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {grayGradient} from '@frogpond/colors'

import {CATEGORY_GRID_ID, CategoryGrid, categoryLayoutFor} from '../category-grid'
import type {CategoryGroup} from '../lib/category-groups'
import type {MapGroupLabel} from '../../telemetry/catalog'

const mockFontScale = jest.fn(() => 1)
// `react-native` re-exports this through a getter, which jest.spyOn cannot
// replace, so the module behind it is mocked instead.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: () => ({width: 390, height: 844, scale: 3, fontScale: mockFontScale()}),
}))

beforeEach(() => {
	mockFontScale.mockReturnValue(1)
})

const group = (label: string): CategoryGroup => ({
	label: label as MapGroupLabel,
	categories: [label.toLowerCase()],
	icon: 'mappin',
	gradient: grayGradient,
})

describe('CategoryGrid', () => {
	test('opens the group whose tile is pressed', async () => {
		let onOpen = jest.fn()
		let parking = group('Parking')
		await render(<CategoryGrid groups={[group('Dining'), parking]} onOpen={onOpen} />)
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		expect(onOpen).toHaveBeenCalledWith(parking)
	})
})

describe('categoryLayoutFor', () => {
	// The grid holds four columns up to xLarge; past that its labels have no
	// room, so the groups become a list rather than a narrower grid.
	test('a grid while it keeps four columns, a list after', () => {
		expect(categoryLayoutFor(1)).toBe('grid')
		expect(categoryLayoutFor(1.118)).toBe('grid')
		expect(categoryLayoutFor(1.235)).toBe('list')
		expect(categoryLayoutFor(3.571)).toBe('list')
	})
})

describe('CategoryGrid as a list', () => {
	test('draws rows, not the grid, at a large text size', async () => {
		mockFontScale.mockReturnValue(1.235)
		await render(<CategoryGrid groups={[group('Dining'), group('Parking')]} onOpen={jest.fn()} />)
		expect(screen.queryByTestId(CATEGORY_GRID_ID)).toBeNull()
		expect(screen.getByRole('button', {name: 'Dining'})).toBeTruthy()
	})

	test('opens the group whose row is pressed', async () => {
		mockFontScale.mockReturnValue(1.235)
		let onOpen = jest.fn()
		let parking = group('Parking')
		await render(<CategoryGrid groups={[group('Dining'), parking]} onOpen={onOpen} />)
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		expect(onOpen).toHaveBeenCalledWith(parking)
	})
})
