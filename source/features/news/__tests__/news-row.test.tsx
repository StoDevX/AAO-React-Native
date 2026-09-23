import * as React from 'react'
import {render, screen} from '@testing-library/react-native'

import {NewsRow} from '../news-row'
import type {StoryType} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const story: StoryType = {
	authors: [],
	categories: [],
	content: '',
	excerpt: 'The choir tours Norway.',
	link: 'https://wp.stolaf.edu/news/choir',
	title: 'Choir on tour',
}

describe('NewsRow', () => {
	/// A story opens in the browser, and the arrow saying so is drawn rather
	/// than read, so VoiceOver has to hear it from the row itself.
	it('tells VoiceOver it is a link', async () => {
		await render(<NewsRow isLast={false} onPress={jest.fn()} story={story} thumbnail={false} />)

		expect(
			screen.getByRole('link', {name: 'Choir on tour. The choir tours Norway.'}),
		).toBeOnTheScreen()
	})
})
