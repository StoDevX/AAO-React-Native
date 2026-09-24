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
	it('names its count in its spoken label, in the caller’s words', async () => {
		await render(
			<GradientTile
				count={13}
				countLabel={(count) => `${count} postings`}
				gradient={blueGradient}
				icon="music.note"
				onPress={jest.fn()}
				title="Music"
			/>,
		)
		expect(screen.getByLabelText('Music, 13 postings')).toBeOnTheScreen()
	})

	// A tile shared by Directory and Student Orgs cannot know what it counts.
	it('says just the number when the caller gives no words', async () => {
		await render(
			<GradientTile
				count={4}
				gradient={blueGradient}
				icon="music.note"
				onPress={jest.fn()}
				title="Music"
			/>,
		)
		expect(screen.getByLabelText('Music, 4')).toBeOnTheScreen()
	})

	// A dimmed tile is not disabled, so VoiceOver has only the label to tell
	// an empty area from one still loading.
	it('says an empty count in the caller’s words, and draws no capsule', async () => {
		await render(
			<GradientTile
				count={0}
				countLabel={(count) => (count === 0 ? 'no postings' : `${count} postings`)}
				gradient={blueGradient}
				icon="sparkles"
				onPress={jest.fn()}
				title="Faith"
			/>,
		)
		expect(screen.getByLabelText('Faith, no postings')).toBeOnTheScreen()
		expect(screen.queryByText('0')).not.toBeOnTheScreen()
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

	// An empty area still opens, to a list that says so.
	it('still opens when dimmed', async () => {
		let onPress = jest.fn()
		await render(
			<GradientTile
				dimmed={true}
				gradient={blueGradient}
				icon="sparkles"
				onPress={onPress}
				title="Faith"
			/>,
		)
		fireEvent.press(screen.getByLabelText('Faith'))
		expect(onPress).toHaveBeenCalledTimes(1)
	})
})
