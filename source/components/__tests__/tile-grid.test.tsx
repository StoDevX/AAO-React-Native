import * as React from 'react'
import {Text} from 'react-native'
import {render, screen, within} from '@testing-library/react-native'

import {TileGrid} from '../tile-grid'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})

const mockFontScale = jest.fn(() => 1)
// `react-native` re-exports this through a getter, which jest.spyOn cannot
// replace, so the module behind it is mocked instead.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: () => ({width: 402, height: 874, scale: 3, fontScale: mockFontScale()}),
}))

const NAMES = ['Art', 'Biology', 'Chemistry', 'Dance', 'English']

function renderGrid(columns?: number): Promise<unknown> {
	return render(
		<TileGrid
			accessibilityId="test-grid"
			columns={columns}
			items={NAMES}
			keyForItem={(name) => name}
			renderItem={(name) => <Text>{name}</Text>}
		/>,
	)
}

type HostElement = ReturnType<typeof screen.getByTestId>

/** The names in each `Grid.Row`, read off the host views under the grid. */
function rowsOf(grid: HostElement): string[][] {
	return grid.children
		.filter((row): row is HostElement => typeof row !== 'string')
		.map((row) =>
			within(row)
				.queryAllByText(/./u)
				.map((node) => String(node.props.children)),
		)
}

describe('TileGrid', () => {
	beforeEach(() => {
		mockFontScale.mockReturnValue(1)
	})

	it('splits the items into rows of the Dynamic Type column count', async () => {
		await renderGrid()
		expect(rowsOf(screen.getByTestId('test-grid'))).toEqual([
			['Art', 'Biology', 'Chemistry', 'Dance'],
			['English'],
		])
	})

	it('takes fewer columns at a larger text size', async () => {
		mockFontScale.mockReturnValue(1.6)
		await renderGrid()
		expect(rowsOf(screen.getByTestId('test-grid'))).toEqual([
			['Art', 'Biology'],
			['Chemistry', 'Dance'],
			['English'],
		])
	})

	it('splits the items into rows of the column count it is given', async () => {
		await renderGrid(3)
		expect(rowsOf(screen.getByTestId('test-grid'))).toEqual([
			['Art', 'Biology', 'Chemistry'],
			['Dance', 'English'],
		])
	})
})
