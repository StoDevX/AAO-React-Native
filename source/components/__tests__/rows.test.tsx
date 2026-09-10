import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {DisclosureRow} from '../rows'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})

describe('DisclosureRow', () => {
	it('renders the detail line when there is one', async () => {
		await render(
			<DisclosureRow detail="Runs every 20 minutes" onPress={jest.fn()} title="Shuttle" />,
		)

		expect(screen.getByText('Shuttle')).toBeOnTheScreen()
		expect(screen.getByText('Runs every 20 minutes')).toBeOnTheScreen()
	})

	it('omits the detail line rather than rendering an empty one', async () => {
		await render(<DisclosureRow onPress={jest.fn()} title="Shuttle" />)

		expect(screen.getByText('Shuttle')).toBeOnTheScreen()
		expect(screen.queryByText('')).not.toBeOnTheScreen()
	})

	it('reads the title and detail as one label, so VoiceOver announces both', async () => {
		await render(
			<DisclosureRow detail="Runs every 20 minutes" onPress={jest.fn()} title="Shuttle" />,
		)

		expect(screen.getByLabelText('Shuttle, Runs every 20 minutes')).toBeOnTheScreen()
	})

	it('falls back to the title alone when there is no detail', async () => {
		await render(<DisclosureRow onPress={jest.fn()} title="Shuttle" />)

		expect(screen.getByLabelText('Shuttle')).toBeOnTheScreen()
	})

	it('calls onPress when tapped', async () => {
		let onPress = jest.fn()
		await render(<DisclosureRow onPress={onPress} title="Shuttle" />)

		fireEvent.press(screen.getByLabelText('Shuttle'))

		expect(onPress).toHaveBeenCalledTimes(1)
	})
})
