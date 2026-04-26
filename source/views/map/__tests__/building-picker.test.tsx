import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {BuildingPicker} from '../building-picker'
import {MapSelectionProvider} from '../selection-context'
import type {Building, Feature} from '../types'

const mockReplace = jest.fn()
const mockNavigation = {replace: mockReplace, setOptions: jest.fn()}

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation,
}))

jest.mock('@react-native-segmented-control/segmented-control', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
	let React = require('react')
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
	let {Pressable, Text, View} = require('react-native')
	return {
		__esModule: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		default: (props: any) =>
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			React.createElement(
				View,
				null,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				props.values.map((label: string, index: number) =>
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
					React.createElement(
						Pressable,
						{
							key: label,
							onPress: () =>
								// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
								props.onChange?.({
									nativeEvent: {selectedSegmentIndex: index},
								}),
						},
						// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
						React.createElement(Text, null, label),
					),
				),
			),
	}
})

const make = (
	id: string,
	name: string,
	categories: Building['categories'] = ['building'],
	nickname = '',
): Feature<Building> => ({
	type: 'Feature',
	id,
	geometry: {type: 'GeometryCollection', geometries: []},
	properties: {
		accessibility: 'unknown',
		address: null,
		categories,
		departments: [],
		description: '',
		floors: [],
		name,
		nickname,
		offices: [],
	},
})

const mockFixtures: Array<Feature<Building>> = [
	make('a', 'Alpha Hall', ['building']),
	make('b', 'Beta Lot', ['parking']),
	make('c', 'Gamma Field', ['outdoors']),
]

jest.mock('../query', () => ({
	mapDataOptions: {
		queryKey: ['carleton-map', 'geojson'],
		queryFn: () => Promise.resolve(mockFixtures),
	},
	useMapData: () => ({data: mockFixtures, isLoading: false, error: null}),
}))

const renderPicker = () => {
	let client = new QueryClient({
		defaultOptions: {queries: {retry: false}},
	})
	return render(
		<QueryClientProvider client={client}>
			<MapSelectionProvider>
				<BuildingPicker />
			</MapSelectionProvider>
		</QueryClientProvider>,
	)
}

beforeEach(() => {
	mockReplace.mockClear()
})

it('renders the buildings category by default and filters to that category', () => {
	renderPicker()
	expect(screen.getByText('Alpha Hall')).toBeTruthy()
	expect(screen.queryByText('Beta Lot')).toBeNull()
	expect(screen.queryByText('Gamma Field')).toBeNull()
})

it('switches the visible list when a different category is chosen', () => {
	renderPicker()
	fireEvent.press(screen.getByText('Outdoors'))
	expect(screen.getByText('Gamma Field')).toBeTruthy()
	expect(screen.queryByText('Alpha Hall')).toBeNull()
})

it('navigates to MapBuildingInfo and dispatches selection when a row is tapped', () => {
	renderPicker()
	fireEvent.press(screen.getByText('Alpha Hall'))
	expect(mockReplace).toHaveBeenCalledWith('MapBuildingInfo', {buildingId: 'a'})
})
