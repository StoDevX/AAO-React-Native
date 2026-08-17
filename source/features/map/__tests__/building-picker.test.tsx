import React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {BuildingPicker} from '../building-picker'
import {keys} from '../query'
import {makeBuilding} from './fixtures'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

const fixtures = [
	makeBuilding({id: 'a', name: 'Alpha Hall', categories: ['building']}),
	makeBuilding({id: 'b', name: 'Beta Lot', categories: ['parking']}),
	makeBuilding({id: 'c', name: 'Gamma Field', categories: ['outdoors']}),
]

// Every query left without observers gets a garbage-collection timeout, and
// React Query's default is five minutes -- long enough to outlive the run and
// leave the Jest worker to be force-killed rather than exiting on its own.
// Testing Library registers its unmounting afterEach when it is imported, and
// Jest runs afterEach hooks in registration order, so by the time this one
// runs the components are gone and every gc timeout has been armed.
const trackedQueryClients: QueryClient[] = []

afterEach(() => {
	for (let queryClient of trackedQueryClients) {
		queryClient.clear()
	}
	trackedQueryClients.length = 0
})

async function renderPicker(onSelect = jest.fn()) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
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
		await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
		await waitFor(() => {
			expect(screen.queryByText('Outdoors')).toBeNull()
		})
		expect(screen.getByText('Gamma Field')).toBeTruthy()
	})

	it('still matches when the query carries leading whitespace', async () => {
		await renderPicker()
		await fireEvent.changeText(screen.getByLabelText('Search for a place'), ' gamma')
		await waitFor(() => {
			expect(screen.getByText('Gamma Field')).toBeTruthy()
		})
	})
})
