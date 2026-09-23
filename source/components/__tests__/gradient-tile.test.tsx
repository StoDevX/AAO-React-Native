import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {blueGradient} from '@frogpond/colors'

import {GradientTile} from '../gradient-tile'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})

describe('GradientTile', () => {
	it('names its count in its spoken label', async () => {
		await render(
			<GradientTile
				count={13}
				gradient={blueGradient}
				icon="music.note"
				onPress={jest.fn()}
				title="Music"
			/>,
		)
		expect(screen.getByLabelText('Music, 13 postings')).toBeOnTheScreen()
	})

	it('says one posting, not one postings', async () => {
		await render(
			<GradientTile
				count={1}
				gradient={blueGradient}
				icon="paintpalette.fill"
				onPress={jest.fn()}
				title="Art"
			/>,
		)
		expect(screen.getByLabelText('Art, 1 posting')).toBeOnTheScreen()
	})

	it('draws the count on the card', async () => {
		await render(
			<GradientTile
				count={13}
				gradient={blueGradient}
				icon="music.note"
				onPress={jest.fn()}
				title="Music"
			/>,
		)
		expect(screen.getByText('13')).toBeOnTheScreen()
	})

	it('draws no count when it has none', async () => {
		await render(
			<GradientTile gradient={blueGradient} icon="music.note" onPress={jest.fn()} title="Music" />,
		)
		expect(screen.getByLabelText('Music')).toBeOnTheScreen()
		expect(screen.queryByText('0')).not.toBeOnTheScreen()
	})

	it('does not fire when disabled', async () => {
		let onPress = jest.fn()
		await render(
			<GradientTile
				disabled={true}
				gradient={blueGradient}
				icon="sparkles"
				onPress={onPress}
				title="Faith"
			/>,
		)
		fireEvent.press(screen.getByLabelText('Faith'))
		expect(onPress).not.toHaveBeenCalled()
	})
})
