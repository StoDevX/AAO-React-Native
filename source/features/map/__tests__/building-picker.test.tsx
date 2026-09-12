import React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {BuildingPicker} from '../building-picker'
import {CATEGORY_LABELS} from '../lib/categories'
import {keys} from '../query'
import {makeBuilding} from './fixtures'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@frogpond/campus-search-bar', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./campus-search-bar-mock') as typeof import('./campus-search-bar-mock')
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

async function renderPicker({
	compact = false,
	onSelect = jest.fn(),
	onSearchFocusChange = jest.fn(),
	onSearchCancel = jest.fn(),
} = {}) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
	// Seeding the cache rather than mocking the query module keeps the
	// component on its real data path.
	client.setQueryData(keys.all('carleton'), fixtures)
	await render(
		<QueryClientProvider client={client}>
			<BuildingPicker
				campus="carleton"
				compact={compact}
				onSearchCancel={onSearchCancel}
				onSearchFocusChange={onSearchFocusChange}
				onSelect={onSelect}
			/>
		</QueryClientProvider>,
	)
	return {onSelect, onSearchFocusChange, onSearchCancel}
}

describe('BuildingPicker', () => {
	it('renders the buildings category by default and filters to that category', async () => {
		await renderPicker()
		expect(screen.getByText('Alpha Hall')).toBeTruthy()
		expect(screen.queryByText('Beta Lot')).toBeNull()
		expect(screen.queryByText('Gamma Field')).toBeNull()
	})

	it('draws the search field alone when the sheet has room for nothing else', async () => {
		await renderPicker({compact: true})
		expect(screen.getByLabelText('Search for a place')).toBeTruthy()
		for (let label of CATEGORY_LABELS) {
			expect(screen.queryByText(label)).toBeNull()
		}
	})

	it('draws the categories once the sheet has room for them', async () => {
		await renderPicker({compact: false})
		for (let label of CATEGORY_LABELS) {
			expect(screen.getByText(label)).toBeTruthy()
		}
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

	it('reports focus changes on the search field to the screen', async () => {
		let {onSearchFocusChange} = await renderPicker()
		let field = screen.getByLabelText('Search for a place')
		await fireEvent(field, 'focus')
		expect(onSearchFocusChange).toHaveBeenLastCalledWith(true, false)
		await fireEvent(field, 'blur')
		expect(onSearchFocusChange).toHaveBeenLastCalledWith(false, false)
	})

	it('tells the screen a blurred field still holds a query', async () => {
		let {onSearchFocusChange} = await renderPicker()
		let field = screen.getByLabelText('Search for a place')
		await fireEvent.changeText(field, 'gamma')
		await fireEvent(field, 'blur')
		expect(onSearchFocusChange).toHaveBeenLastCalledWith(false, true)
	})

	it('clears the query and shows the categories again when the search is cancelled', async () => {
		let {onSearchCancel} = await renderPicker()
		await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
		await waitFor(() => {
			expect(screen.queryByText('Outdoors')).toBeNull()
		})
		await fireEvent.press(screen.getByText('Cancel'))
		expect(onSearchCancel).toHaveBeenCalledTimes(1)
		await waitFor(() => {
			expect(screen.getByText('Outdoors')).toBeTruthy()
		})
		expect(screen.getByText('Alpha Hall')).toBeTruthy()
	})
})
