import React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import type {Campus} from '../../building-hours/types'
import {BuildingPicker} from '../building-picker'
import {keys as categoryKeys} from '../category-groups-query'
import type {MapCategoryTable} from '../lib/category-groups'
import {keys} from '../query'
import {makeBuilding} from './fixtures'
import {track} from '../../telemetry/track'

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
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)
jest.mock('../../telemetry/track', () => ({track: jest.fn()}))

const fixtures = [
	makeBuilding({id: 'a', name: 'Alpha Hall', categories: ['building']}),
	makeBuilding({id: 'b', name: 'Beta Lot', categories: ['parking']}),
	makeBuilding({id: 'c', name: 'Gamma Field', categories: ['outdoors']}),
]

const TABLE: MapCategoryTable = {
	stolaf: [],
	carleton: [
		{label: 'All Buildings', categories: ['building'], icon: 'building.2.fill', gradient: 'gray'},
		{label: 'Outdoors', categories: ['outdoors'], icon: 'tree.fill', gradient: 'green'},
		{label: 'Parking', categories: ['parking'], icon: 'parkingsign', gradient: 'light-blue'},
		{label: 'Dining', categories: ['dining'], icon: 'fork.knife', gradient: 'orange'},
	],
}

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

type PickerOverrides = {compact?: boolean; campus?: Campus}

async function renderPicker({
	buildings = fixtures,
	compact = false,
	campus = 'carleton' as Campus,
	table = TABLE as MapCategoryTable | null,
	onSelect = jest.fn(),
	onSearchFocusChange = jest.fn(),
	onSearchCancel = jest.fn(),
} = {}) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
	// Seeding the cache rather than mocking the query module keeps the
	// component on its real data path.
	client.setQueryData(keys.all('carleton'), buildings)
	client.setQueryData(keys.all('stolaf'), buildings)
	if (table) {
		client.setQueryData(categoryKeys.all, table)
	}

	let tree = (props: Required<PickerOverrides>) => (
		<QueryClientProvider client={client}>
			<BuildingPicker
				campus={props.campus}
				compact={props.compact}
				onHeaderHeightChange={jest.fn()}
				onSearchCancel={onSearchCancel}
				onSearchFocusChange={onSearchFocusChange}
				onSelect={onSelect}
			/>
		</QueryClientProvider>
	)

	let current = {compact, campus}
	let {rerender} = await render(tree(current))
	let rerenderWith = async (overrides: PickerOverrides) => {
		current = {...current, ...overrides}
		await rerender(tree(current))
	}
	return {client, onSelect, onSearchFocusChange, onSearchCancel, rerenderWith}
}

describe('BuildingPicker', () => {
	it('draws a tile for each group with places, and no list', async () => {
		await renderPicker()
		for (let label of ['All Buildings', 'Outdoors', 'Parking']) {
			expect(screen.getByRole('button', {name: label})).toBeTruthy()
		}
		// Carleton's fixtures have no dining places.
		expect(screen.queryByRole('button', {name: 'Dining'})).toBeNull()
		expect(screen.queryByText('Alpha Hall')).toBeNull()
	})

	it('draws the search field alone when the sheet has room for nothing else', async () => {
		await renderPicker({compact: true})
		expect(screen.getByLabelText('Search for a place')).toBeTruthy()
		expect(screen.queryByRole('button', {name: 'Parking'})).toBeNull()
	})

	it("opens a group's places under a header naming it", async () => {
		await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		expect(screen.getByText('Beta Lot')).toBeTruthy()
		expect(screen.queryByText('Alpha Hall')).toBeNull()
		expect(screen.getByText('Parking')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Back'})).toBeTruthy()
	})

	it('returns to the grid from a group', async () => {
		await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		await fireEvent.press(screen.getByRole('button', {name: 'Back'}))
		expect(screen.getByRole('button', {name: 'Outdoors'})).toBeTruthy()
		expect(screen.queryByText('Beta Lot')).toBeNull()
	})

	it('hides the header while the sheet is collapsed, and keeps the group open', async () => {
		let {rerenderWith} = await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		await rerenderWith({compact: true})
		expect(screen.queryByRole('button', {name: 'Back'})).toBeNull()
		await rerenderWith({compact: false})
		expect(screen.getByRole('button', {name: 'Back'})).toBeTruthy()
		expect(screen.getByText('Beta Lot')).toBeTruthy()
	})

	it('searches every place from inside a group, and returns to it on cancel', async () => {
		await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
		await waitFor(() => {
			expect(screen.getByText('Gamma Field')).toBeTruthy()
		})
		expect(screen.queryByRole('button', {name: 'Back'})).toBeNull()
		await fireEvent.press(screen.getByText('Cancel'))
		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Back'})).toBeTruthy()
		})
		expect(screen.getByText('Beta Lot')).toBeTruthy()
	})

	it('hides the grid and searches across every group while typing', async () => {
		await renderPicker()
		await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
		await waitFor(() => {
			expect(screen.queryByRole('button', {name: 'Outdoors'})).toBeNull()
		})
		expect(screen.getByText('Gamma Field')).toBeTruthy()
	})

	it('returns to the grid when the open group empties', async () => {
		let {client} = await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		await act(() => {
			client.setQueryData(
				keys.all('carleton'),
				fixtures.filter((place) => place.id !== 'b'),
			)
		})
		await waitFor(() => {
			expect(screen.queryByRole('button', {name: 'Back'})).toBeNull()
		})
		expect(screen.getByRole('button', {name: 'Outdoors'})).toBeTruthy()
	})

	it('closes the open group when the campus changes', async () => {
		let {rerenderWith} = await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Outdoors'}))
		await rerenderWith({campus: 'stolaf'})
		await rerenderWith({campus: 'carleton'})
		expect(screen.queryByRole('button', {name: 'Back'})).toBeNull()
	})

	it('draws the grid from the bundled copy while the groups query has failed', async () => {
		await renderPicker({table: null})
		// The bundled Carleton table has an All Buildings group, and Alpha Hall
		// is a building.
		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'All Buildings'})).toBeTruthy()
		})
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

	it('clears the query and shows the grid again when the search is cancelled', async () => {
		let {onSearchCancel} = await renderPicker()
		await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
		await waitFor(() => {
			expect(screen.queryByRole('button', {name: 'Outdoors'})).toBeNull()
		})
		await fireEvent.press(screen.getByText('Cancel'))
		expect(onSearchCancel).toHaveBeenCalledTimes(1)
		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Outdoors'})).toBeTruthy()
		})
	})

	// An honor house renamed each year carries every name, newest first; the
	// row shows the current one.
	it("shows a building's first nickname when it has several", async () => {
		await renderPicker({
			buildings: [
				makeBuilding({
					id: 'h',
					name: 'Holtan House',
					categories: ['building'],
					nickname: ['Food Justice House', 'Ecology House'],
				}),
			],
		})
		await fireEvent.press(screen.getByRole('button', {name: 'All Buildings'}))

		expect(screen.getByText('Food Justice House')).toBeTruthy()
		expect(screen.queryByText(/Ecology House/u)).toBeNull()
	})

	describe('counting searches that find nothing', () => {
		beforeEach(() => {
			jest.mocked(track).mockClear()
		})

		it('counts a search that finds nothing, without its text', async () => {
			await renderPicker()

			await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'zzz')
			await waitFor(() => {
				expect(screen.getByText('No buildings to show.')).toBeTruthy()
			})

			expect(track).toHaveBeenCalledWith({name: 'map.search.empty', attributes: {}})
		})

		it('counts it once while the search keeps finding nothing', async () => {
			await renderPicker()
			let field = screen.getByLabelText('Search for a place')

			await fireEvent.changeText(field, 'zzz')
			await waitFor(() => {
				expect(track).toHaveBeenCalledTimes(1)
			})
			await fireEvent.changeText(field, 'zzzz')
			await waitFor(() => {
				expect(screen.getByText('No buildings to show.')).toBeTruthy()
			})

			expect(track).toHaveBeenCalledTimes(1)
		})

		it('does not count a search that finds something', async () => {
			await renderPicker()

			await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
			await waitFor(() => {
				expect(screen.getByText('Gamma Field')).toBeTruthy()
			})

			expect(track).not.toHaveBeenCalled()
		})
	})

	describe('counting opened groups', () => {
		beforeEach(() => {
			jest.mocked(track).mockClear()
		})

		it('counts a group opened from its tile, with the campus', async () => {
			await renderPicker()
			await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
			expect(track).toHaveBeenCalledWith({
				name: 'map.group.open',
				attributes: {group: 'Parking', campus: 'carleton'},
			})
		})

		it('does not count a group coming back into view', async () => {
			let {rerenderWith} = await renderPicker()
			await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
			await rerenderWith({compact: true})
			await rerenderWith({compact: false})
			expect(track).toHaveBeenCalledTimes(1)
		})
	})
})
