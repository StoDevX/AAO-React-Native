import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {BuildingList} from '../building-list'
import type {Building, Feature} from '../types'

const make = (id: string, name: string): Feature<Building> => ({
	type: 'Feature',
	id,
	geometry: {type: 'GeometryCollection', geometries: []},
	properties: {
		accessibility: 'unknown',
		address: null,
		categories: ['building'],
		departments: [],
		description: '',
		floors: [],
		name,
		nickname: '',
		offices: [],
	},
})

it('renders one row per building', () => {
	render(
		<BuildingList
			buildings={[make('a', 'Alpha'), make('b', 'Beta')]}
			onSelect={jest.fn()}
		/>,
	)
	expect(screen.getByText('Alpha')).toBeTruthy()
	expect(screen.getByText('Beta')).toBeTruthy()
})

it('invokes onSelect with the building id when a row is pressed', () => {
	let onSelect = jest.fn()
	render(<BuildingList buildings={[make('a', 'Alpha')]} onSelect={onSelect} />)
	fireEvent.press(screen.getByText('Alpha'))
	expect(onSelect).toHaveBeenCalledWith('a')
})

it('renders an empty state when given no buildings', () => {
	render(<BuildingList buildings={[]} onSelect={jest.fn()} />)
	expect(screen.getByText(/No buildings/iu)).toBeTruthy()
})
