import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {BuildingList} from '../building-list'
import {makeBuilding} from './fixtures'

describe('BuildingList', () => {
	it('renders one row per building', async () => {
		await render(
			<BuildingList
				buildings={[
					makeBuilding({id: 'a', name: 'Alpha'}),
					makeBuilding({id: 'b', name: 'Beta'}),
				]}
				onSelect={jest.fn()}
			/>,
		)
		expect(screen.getByText('Alpha')).toBeTruthy()
		expect(screen.getByText('Beta')).toBeTruthy()
	})

	it('invokes onSelect with the building id when a row is pressed', async () => {
		let onSelect = jest.fn()
		await render(
			<BuildingList
				buildings={[makeBuilding({id: 'a', name: 'Alpha'})]}
				onSelect={onSelect}
			/>,
		)
		await fireEvent.press(screen.getByText('Alpha'))
		expect(onSelect).toHaveBeenCalledWith('a')
	})

	it('renders an empty state when given no buildings', async () => {
		await render(<BuildingList buildings={[]} onSelect={jest.fn()} />)
		expect(screen.getByText(/No buildings/iu)).toBeTruthy()
	})
})
