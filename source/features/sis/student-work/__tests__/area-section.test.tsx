import * as React from 'react'
import {render, screen, within} from '@testing-library/react-native'
import {resolveGradient} from '@frogpond/colors'

import {AreaSection} from '../area-section'
import type {AreaStatus, StudentWorkArea} from '../areas'

const mockFontScale = jest.fn(() => 1)
// `react-native` re-exports this through a getter, which jest.spyOn cannot
// replace, so the module behind it is mocked instead.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: () => ({width: 390, height: 844, scale: 3, fontScale: mockFontScale()}),
}))

const AREAS: StudentWorkArea[] = ['dining', 'library', 'music', 'athletics'].map((slug) => ({
	name: slug,
	slug,
	icon: 'star.fill',
	gradient: resolveGradient('gold'),
	units: [],
}))

const MEMBERSHIP = new Map<string, AreaStatus>(
	AREAS.map((area) => [area.slug, {ids: new Set(['a', 'b']), count: 2, empty: false}]),
)

function renderAreas(layout: 'grid' | 'list'): Promise<unknown> {
	return render(
		<AreaSection areas={AREAS} layout={layout} membership={MEMBERSHIP} onSelectArea={jest.fn()} />,
	)
}

describe('AreaSection', () => {
	it('draws the areas as tiles in grid layout', async () => {
		await renderAreas('grid')
		expect(screen.getByTestId('student-work-area-grid')).toBeOnTheScreen()
		expect(screen.getByLabelText('dining, 2 postings')).toBeOnTheScreen()
	})

	/// A row speaks its count bare, as Settings does; a tile names it postings.
	it('draws the areas as rows in list layout', async () => {
		await renderAreas('list')
		expect(screen.getByLabelText('dining, 2')).toBeOnTheScreen()
		expect(screen.queryByTestId('student-work-area-grid')).toBeNull()
	})

	it('lays the grid out three a row', async () => {
		await renderAreas('grid')
		let rows = screen
			.getByTestId('student-work-area-grid')
			.children.filter((row) => typeof row !== 'string')
			.map((row) =>
				within(row)
					.queryAllByText(/^[a-z]+$/u)
					.map((node) => String(node.props.children)),
			)
		expect(rows).toEqual([['dining', 'library', 'music'], ['athletics']])
	})
})
