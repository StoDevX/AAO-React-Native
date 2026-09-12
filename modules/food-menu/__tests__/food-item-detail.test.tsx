import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {MenuItemDetailView} from '../food-item-detail'
import type {MasterCorIconMapType, MenuItemType, NutritionDetailContainer} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})

function item(overrides: Partial<MenuItemType>): MenuItemType {
	return {
		connector: '',
		cor_icon: {},
		description: '',
		id: '1',
		label: 'Pot Roast',
		monotony: {} as MenuItemType['monotony'],
		nutrition: {} as MenuItemType['nutrition'],
		nutrition_link: '',
		options: [],
		price: '',
		rating: '',
		special: false,
		station: 'Home',
		sub_station: '',
		sub_station_id: '',
		sub_station_order: '',
		tier3: false,
		zero_entree: '',
		...overrides,
	}
}

function nutrition(
	entries: Record<string, {label: string; value: number; unit: string}>,
): NutritionDetailContainer {
	return entries as unknown as NutritionDetailContainer
}

const COR_ICONS: MasterCorIconMapType = {
	vegan: {sort: '1', label: 'Vegan', description: '', image: 'https://x/vegan.png'},
	halal: {sort: '2', label: 'Halal', description: '', image: ''},
}

describe('MenuItemDetailView', () => {
	// The description section is the item's own; a dish without one -- most of
	// them -- must not leave an empty card with a header over it.
	test('gives a dish with a description its own section', async () => {
		await render(<MenuItemDetailView icons={{}} item={item({description: 'Served with gravy'})} />)

		expect(screen.getByText('Description')).toBeTruthy()
		expect(screen.getByText('Served with gravy')).toBeTruthy()
	})

	test('omits the description section when the dish has none', async () => {
		await render(<MenuItemDetailView icons={{}} item={item({description: ''})} />)

		expect(screen.queryByText('Description')).toBeNull()
	})

	// The detail screen pairs each badge with the category's full name, which is
	// where a reader learns what a two-letter mark on the menu meant.
	test('lists every dietary tag the dish carries, badge and name', async () => {
		await render(
			<MenuItemDetailView icons={COR_ICONS} item={item({cor_icon: {vegan: '', halal: ''}})} />,
		)

		expect(screen.getByText('Vegan')).toBeTruthy()
		expect(screen.getByText('Halal')).toBeTruthy()
		expect(screen.getByText('V')).toBeTruthy()
		expect(screen.getByText('H')).toBeTruthy()
	})

	test('omits the dietary section when the dish carries no tags', async () => {
		await render(<MenuItemDetailView icons={COR_ICONS} item={item({cor_icon: {}})} />)

		expect(screen.queryByText('Dietary')).toBeNull()
	})

	// The panel shows no % Daily Value and no servings per container, so it says
	// where its figures come from rather than implying it is a regulated label.
	test('attributes the figures to the cafe when it has some', async () => {
		await render(
			<MenuItemDetailView
				icons={{}}
				item={item({
					nutrition_details: nutrition({
						fatContent: {label: 'Total Fat', value: 12, unit: 'g'},
					}),
				})}
			/>,
		)

		expect(screen.getByText('As reported by the cafe.')).toBeTruthy()
	})

	test('says so when the dish has no nutrition details', async () => {
		await render(<MenuItemDetailView icons={{}} item={item({nutrition_details: undefined})} />)

		expect(screen.getByText('No nutritional information')).toBeTruthy()
		expect(screen.queryByText('As reported by the cafe.')).toBeNull()
	})
})
