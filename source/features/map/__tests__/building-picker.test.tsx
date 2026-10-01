import React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {lightBlueGradient} from '@frogpond/colors'

import type {Campus} from '../../building-hours/types'
import {BuildingPicker} from '../building-picker'
import {keys as categoryKeys} from '../category-groups-query'
import type {MapCategoryTable} from '../lib/category-groups'
import {groupColor} from '../lib/category-groups'
import {SEARCH_PIN_COLOR, type MapPins} from '../lib/map-pins'
import {keys} from '../query'
import {useRecentPlacesStore} from '../store'
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
	stolaf: {groups: [], icons: []},
	carleton: {
		groups: [
			{label: 'All Buildings', categories: ['building'], icon: 'building.2.fill', gradient: 'gray'},
			{label: 'Outdoors', categories: ['outdoors'], icon: 'tree.fill', gradient: 'green'},
			{label: 'Parking', categories: ['parking'], icon: 'parkingsign', gradient: 'light-blue'},
			{label: 'Dining', categories: ['dining'], icon: 'fork.knife', gradient: 'orange'},
		],
		icons: [],
	},
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
	onPinsChange = jest.fn(),
	onGroupOpen = jest.fn(),
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
				onGroupOpen={onGroupOpen}
				onPinsChange={onPinsChange}
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
	return {
		client,
		onSelect,
		onSearchFocusChange,
		onSearchCancel,
		onPinsChange,
		onGroupOpen,
		rerenderWith,
	}
}

/// The pins most recently reported, as place names, with their color and
/// frame key; `null` or `undefined` as reported.
function lastPins(onPinsChange: jest.Mock) {
	let pins = onPinsChange.mock.calls.at(-1)?.[0] as MapPins | null | undefined
	return pins
		? {
				names: pins.places.map((place) => place.properties.name),
				color: pins.color,
				frameKey: pins.frameKey,
			}
		: pins
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

	it('keeps the grid when an emptied group gets its places back', async () => {
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
		await act(() => {
			client.setQueryData(keys.all('carleton'), fixtures)
		})
		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Parking'})).toBeTruthy()
		})
		expect(screen.queryByRole('button', {name: 'Back'})).toBeNull()
	})

	// Each campus publishes its own icons; a row must not take the other's.
	it("draws each row's icon from its own campus's list", async () => {
		await renderPicker({
			table: {
				stolaf: {
					groups: [],
					icons: [{categories: ['outdoors'], icon: 'leaf.fill', gradient: 'green'}],
				},
				carleton: {
					groups: [],
					icons: [{categories: ['outdoors'], icon: 'tree.fill', gradient: 'green'}],
				},
			},
		})
		// Gamma Field is outdoors; Alpha Hall matches no entry and draws the pin.
		expect(screen.getAllByTestId('symbol-tree.fill')).toHaveLength(1)
		expect(screen.queryByTestId('symbol-leaf.fill')).toBeNull()
		expect(screen.getAllByTestId('symbol-mappin').length).toBeGreaterThan(0)
	})

	// A feed whose values no group names -- a server renaming its categories --
	// would otherwise leave an empty sheet with nothing to tap.
	it('lists every place by name when no group has any', async () => {
		await renderPicker({
			table: {
				stolaf: {groups: [], icons: []},
				carleton: {
					groups: [
						{label: 'Dining', categories: ['dining'], icon: 'fork.knife', gradient: 'orange'},
					],
					icons: [],
				},
			},
		})
		expect(screen.queryByRole('button', {name: 'Dining'})).toBeNull()
		expect(
			screen
				.getAllByText(/^(Alpha Hall|Beta Lot|Gamma Field)$/u)
				.map((row) => [row.props.children].flat().join('')),
		).toEqual(['Alpha Hall', 'Beta Lot', 'Gamma Field'])
	})

	it('says so when there are no places at all', async () => {
		await renderPicker({buildings: []})
		expect(screen.getByText('No places to show.')).toBeTruthy()
	})

	// A refetch whose values no group names empties every group at once; the
	// open group has to close then too, or it reopens when they come back.
	it('does not reopen a group after a refetch empties every group', async () => {
		let {client} = await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		await act(() => {
			client.setQueryData(
				keys.all('carleton'),
				fixtures.map((place) => ({
					...place,
					properties: {...place.properties, categories: []},
				})),
			)
		})
		await waitFor(() => {
			expect(screen.queryByRole('button', {name: 'Back'})).toBeNull()
		})
		await act(() => {
			client.setQueryData(keys.all('carleton'), fixtures)
		})
		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Parking'})).toBeTruthy()
		})
		expect(screen.queryByRole('button', {name: 'Back'})).toBeNull()
	})

	it('closes the open group when the campus changes', async () => {
		let {rerenderWith} = await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Outdoors'}))
		await rerenderWith({campus: 'stolaf'})
		await rerenderWith({campus: 'carleton'})
		expect(screen.queryByRole('button', {name: 'Back'})).toBeNull()
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

	// The native bar clears its text before resigning, but JavaScript hears
	// the resignation first; read there, Cancel would look like a search that
	// ended with text.
	it('reports a cancelled field as empty', async () => {
		let {onSearchFocusChange} = await renderPicker()
		let field = screen.getByLabelText('Search for a place')
		await fireEvent(field, 'focus')
		await fireEvent.changeText(field, 'gamma')
		await fireEvent.press(screen.getByText('Cancel'))
		expect(onSearchFocusChange).toHaveBeenLastCalledWith(false, false)
	})

	// Cancel after tapping away finds a field with nothing to resign, so the
	// native bar reports no focus change at all.
	it('reports no focus change for a Cancel after the field lost focus', async () => {
		let {onSearchFocusChange} = await renderPicker()
		let field = screen.getByLabelText('Search for a place')
		await fireEvent(field, 'focus')
		await fireEvent.changeText(field, 'gamma')
		await fireEvent(field, 'blur')
		onSearchFocusChange.mockClear()
		await fireEvent.press(screen.getByText('Cancel'))
		expect(onSearchFocusChange).not.toHaveBeenCalled()
	})

	// A query of only spaces finds nothing, so ending it is not a search with
	// text: the sheet stays where it is and nothing is framed.
	it('treats a field of only spaces as empty when it loses focus', async () => {
		let {onSearchFocusChange, onPinsChange} = await renderPicker()
		let field = screen.getByLabelText('Search for a place')
		await fireEvent(field, 'focus')
		await fireEvent.changeText(field, '   ')
		await fireEvent(field, 'blur')
		expect(onSearchFocusChange).toHaveBeenLastCalledWith(false, false)
		expect(
			onPinsChange.mock.calls.every(([pins]) => pins === null || (pins as MapPins).frameKey === 0),
		).toBe(true)
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
				expect(screen.getByText('No places match “zzz”.')).toBeTruthy()
			})
			await waitFor(() => {
				expect(track).toHaveBeenCalledWith({name: 'map.search.empty', attributes: {}})
			})
		})

		it('counts it once while the search keeps finding nothing', async () => {
			await renderPicker()
			let field = screen.getByLabelText('Search for a place')

			await fireEvent.changeText(field, 'zzz')
			await waitFor(() => {
				expect(track).toHaveBeenCalledTimes(1)
			})
			await fireEvent.changeText(field, 'zzzz')
			// The second search has run once its own text shows.
			await waitFor(() => {
				expect(screen.getByText('No places match “zzzz”.')).toBeTruthy()
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

	it('tells the screen when a group is opened from its tile, and not on Back', async () => {
		let {onGroupOpen} = await renderPicker()
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		await fireEvent.press(screen.getByRole('button', {name: 'Back'}))
		expect(onGroupOpen).toHaveBeenCalledTimes(1)
	})

	describe('pins', () => {
		it("reports a group's places in its color when its tile is tapped", async () => {
			let {onPinsChange} = await renderPicker()
			await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
			expect(lastPins(onPinsChange)).toEqual({
				names: ['Beta Lot'],
				color: groupColor(lightBlueGradient),
				frameKey: 1,
			})
		})

		it('reports nothing for the grid or after Back', async () => {
			let {onPinsChange} = await renderPicker()
			expect(lastPins(onPinsChange)).toBeNull()
			await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
			await fireEvent.press(screen.getByRole('button', {name: 'Back'}))
			expect(lastPins(onPinsChange)).toBeNull()
		})

		it('reports search results in the search color, without framing while typing', async () => {
			let {onPinsChange} = await renderPicker()
			await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
			await waitFor(() => {
				expect(lastPins(onPinsChange)?.names).toEqual(['Gamma Field'])
			})
			expect(lastPins(onPinsChange)).toMatchObject({color: SEARCH_PIN_COLOR, frameKey: 0})
		})

		it('frames a search when it ends with text', async () => {
			let {onPinsChange} = await renderPicker()
			let field = screen.getByLabelText('Search for a place')
			await fireEvent.changeText(field, 'gamma')
			await waitFor(() => {
				expect(lastPins(onPinsChange)?.names).toEqual(['Gamma Field'])
			})
			await fireEvent(field, 'blur')
			expect(lastPins(onPinsChange)).toMatchObject({names: ['Gamma Field'], frameKey: 1})
		})

		// Pressing Search inside the debounce must frame what was typed, not the
		// previous query's results.
		it('frames the search only once its results have caught up', async () => {
			let {onPinsChange} = await renderPicker()
			let field = screen.getByLabelText('Search for a place')
			await fireEvent.changeText(field, 'beta')
			await waitFor(() => {
				expect(lastPins(onPinsChange)?.names).toEqual(['Beta Lot'])
			})
			// Ended inside the debounce: the results on screen are still Beta's.
			await fireEvent.changeText(field, 'gamma')
			await fireEvent(field, 'blur')
			await waitFor(() => {
				expect(lastPins(onPinsChange)?.frameKey).toBe(1)
			})
			let framed = onPinsChange.mock.calls
				.map(([pins]) => pins as MapPins | null)
				.filter((pins) => pins !== null && pins.frameKey === 1)
			expect(framed.map((pins) => pins?.places.map((place) => place.properties.name))).toEqual([
				['Gamma Field'],
			])
		})

		it('leaves frameKey alone when a search is cancelled', async () => {
			let {onPinsChange} = await renderPicker()
			await fireEvent(screen.getByLabelText('Search for a place'), 'focus')
			await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
			await fireEvent.press(screen.getByText('Cancel'))
			await waitFor(() => {
				expect(lastPins(onPinsChange)).toBeNull()
			})
			expect(
				onPinsChange.mock.calls.every(
					([pins]) => pins === null || (pins as MapPins).frameKey === 0,
				),
			).toBe(true)
		})

		it('reports nothing for a search with no results', async () => {
			let {onPinsChange} = await renderPicker()
			await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'zzz')
			await waitFor(() => {
				expect(screen.getByText('No places match “zzz”.')).toBeTruthy()
			})
			expect(lastPins(onPinsChange)).toBeNull()
		})

		it('keeps frameKey across a compact and expand', async () => {
			let {onPinsChange, rerenderWith} = await renderPicker()
			await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
			await rerenderWith({compact: true})
			await rerenderWith({compact: false})
			expect(lastPins(onPinsChange)).toMatchObject({names: ['Beta Lot'], frameKey: 1})
		})
	})

	describe('recents', () => {
		beforeEach(() => {
			useRecentPlacesStore.setState({recent: {stolaf: [], carleton: []}})
		})

		let remember = (...ids: string[]) =>
			useRecentPlacesStore.setState({recent: {stolaf: [], carleton: ids}})

		it('lists the places opened most recently under the grid, newest first', async () => {
			remember('c', 'a')
			await renderPicker()
			expect(screen.getByText('Recents')).toBeTruthy()
			expect(
				screen
					.getAllByText(/^(Alpha Hall|Gamma Field)$/u)
					.map((row) => [row.props.children].flat().join('')),
			).toEqual(['Gamma Field', 'Alpha Hall'])
		})

		it('draws no section before anything has been opened', async () => {
			await renderPicker()
			expect(screen.queryByText('Recents')).toBeNull()
		})

		it('skips a place the map no longer has', async () => {
			remember('gone', 'a')
			await renderPicker()
			expect(screen.getByText('Alpha Hall')).toBeTruthy()
		})

		it('keeps to the root: not inside a group, not while searching', async () => {
			remember('a')
			await renderPicker()
			await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
			expect(screen.queryByText('Recents')).toBeNull()
			await fireEvent.press(screen.getByRole('button', {name: 'Back'}))
			await fireEvent.changeText(screen.getByLabelText('Search for a place'), 'gamma')
			await waitFor(() => {
				expect(screen.getByText('Gamma Field')).toBeTruthy()
			})
			expect(screen.queryByText('Recents')).toBeNull()
		})

		it('clears the campus it shows', async () => {
			useRecentPlacesStore.setState({recent: {stolaf: ['x'], carleton: ['a']}})
			await renderPicker()
			await fireEvent.press(screen.getByRole('button', {name: 'Clear Recents'}))
			expect(useRecentPlacesStore.getState().recent).toEqual({stolaf: ['x'], carleton: []})
			expect(screen.queryByText('Recents')).toBeNull()
		})

		it('opens a remembered place from its row', async () => {
			remember('a')
			let {onSelect} = await renderPicker()
			await fireEvent.press(screen.getByText('Alpha Hall'))
			expect(onSelect).toHaveBeenCalledWith('a')
		})
	})
})
