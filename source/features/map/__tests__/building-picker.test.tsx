import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {BuildingPicker} from '../building-picker'
import {keys} from '../query'
import {makeBuilding} from './fixtures'

jest.mock('@react-native-segmented-control/segmented-control', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('./segmented-control-mock') as typeof import('./segmented-control-mock')
})

const fixtures = [
	makeBuilding({id: 'a', name: 'Alpha Hall', categories: ['building']}),
	makeBuilding({id: 'b', name: 'Beta Lot', categories: ['parking']}),
	makeBuilding({id: 'c', name: 'Gamma Field', categories: ['outdoors']}),
]

async function renderPicker(onSelect = jest.fn()) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	// Seeding the cache rather than mocking the query module keeps the
	// component on its real data path.
	client.setQueryData(keys.all, fixtures)
	await render(
		<QueryClientProvider client={client}>
			<BuildingPicker onSelect={onSelect} />
		</QueryClientProvider>,
	)
	return onSelect
}

describe('BuildingPicker', () => {
	it('renders the buildings category by default and filters to that category', async () => {
		await renderPicker()
		expect(screen.getByText('Alpha Hall')).toBeTruthy()
		expect(screen.queryByText('Beta Lot')).toBeNull()
		expect(screen.queryByText('Gamma Field')).toBeNull()
	})

	it('switches the visible list when a different category is chosen', async () => {
		await renderPicker()
		await fireEvent.press(screen.getByText('Outdoors'))
		expect(screen.getByText('Gamma Field')).toBeTruthy()
		expect(screen.queryByText('Alpha Hall')).toBeNull()
	})

	it('hides the category picker and searches across every category while typing', async () => {
		await renderPicker()
		await fireEvent.changeText(
			screen.getByLabelText('Search for a place'),
			'gamma',
		)
		expect(screen.queryByText('Outdoors')).toBeNull()
		expect(screen.getByText('Gamma Field')).toBeTruthy()
	})

	it('reports the tapped building to its caller', async () => {
		let onSelect = await renderPicker()
		await fireEvent.press(screen.getByText('Alpha Hall'))
		expect(onSelect).toHaveBeenCalledWith('a')
	})
})
