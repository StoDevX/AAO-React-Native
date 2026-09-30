import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {grayGradient} from '@frogpond/colors'

import {CategoryGrid} from '../category-grid'
import type {CategoryGroup} from '../lib/category-groups'
import type {MapGroupLabel} from '../../telemetry/catalog'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const group = (label: string): CategoryGroup => ({
	label: label as MapGroupLabel,
	categories: [label.toLowerCase()],
	icon: 'mappin',
	gradient: grayGradient,
})

describe('CategoryGrid', () => {
	test('opens the group whose tile is pressed', async () => {
		let onOpen = jest.fn()
		let parking = group('Parking')
		await render(<CategoryGrid groups={[group('Dining'), parking]} onOpen={onOpen} />)
		await fireEvent.press(screen.getByRole('button', {name: 'Parking'}))
		expect(onOpen).toHaveBeenCalledWith(parking)
	})
})
