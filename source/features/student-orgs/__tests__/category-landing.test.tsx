import * as React from 'react'
import {render, screen, within} from '@testing-library/react-native'
import {resolveGradient} from '@frogpond/colors'

import {CategoryLanding} from '../category-landing'
import type {CategoryRowData} from '../categories'

const mockFontScale = jest.fn(() => 1)
// `react-native` re-exports this through a getter, which jest.spyOn cannot
// replace, so the module behind it is mocked instead.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: () => ({width: 390, height: 844, scale: 3, fontScale: mockFontScale()}),
}))

const NAMES = ['Academic', 'Awareness', 'Demo', 'Service']

const CATEGORIES: CategoryRowData[] = NAMES.map((name) => ({
	name,
	icon: 'star.fill',
	gradient: resolveGradient('gold'),
	count: 3,
}))

function renderLanding(layout: 'grid' | 'list'): Promise<unknown> {
	return render(
		<CategoryLanding
			categories={CATEGORIES}
			layout={layout}
			onRefresh={() => Promise.resolve()}
			onSelectCategory={jest.fn()}
		/>,
	)
}

describe('CategoryLanding', () => {
	it('draws the categories as tiles in grid layout', async () => {
		await renderLanding('grid')
		expect(screen.getByTestId('student-orgs-category-grid')).toBeOnTheScreen()
		expect(screen.queryByTestId('student-orgs-category-list')).toBeNull()
	})

	it('draws the categories as rows in list layout', async () => {
		await renderLanding('list')
		expect(screen.getByTestId('student-orgs-category-list')).toBeOnTheScreen()
		expect(screen.queryByTestId('student-orgs-category-grid')).toBeNull()
	})

	it('lays the grid out three a row', async () => {
		await renderLanding('grid')
		let rows = screen
			.getByTestId('student-orgs-category-grid')
			.children.filter((row) => typeof row !== 'string')
			.map((row) =>
				within(row)
					.queryAllByText(/./u)
					.map((node) => String(node.props.children)),
			)
		expect(rows).toEqual([['Academic', 'Awareness', 'Demo'], ['Service']])
	})
})
