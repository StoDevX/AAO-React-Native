import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'
import type {UseQueryResult} from '@tanstack/react-query'

import {NewsList} from '../news-list'
import type {StoryType} from '../types'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
jest.mock('@expo/ui/community/picker', () => ({Picker: 'Picker'}))
jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

function makeStory(overrides: Partial<StoryType> = {}): StoryType {
	return {
		authors: [],
		categories: ['Campus & Community'],
		content: '<p>Content</p>',
		excerpt: 'An excerpt',
		title: 'Test story',
		...overrides,
	}
}

function makeQuery(
	overrides: Partial<UseQueryResult<StoryType[]>> = {},
): UseQueryResult<StoryType[]> {
	return {
		data: [],
		error: null,
		isLoading: false,
		isError: false,
		isRefetching: false,
		refetch: jest.fn(),
		...overrides,
	} as unknown as UseQueryResult<StoryType[]>
}

describe('NewsList', () => {
	// This feed's Categories filter never reaches `filterShape`'s sheet
	// threshold, so it always renders as a native `Menu` -- its `label` prop
	// is its own trigger, with no separate button left for `enabled` to mark
	// active or not.
	test('renders the Categories filter as a menu, with no button to mark active', async () => {
		let stories = [
			makeStory({title: 'Campus story', categories: ['Campus & Community']}),
			makeStory({title: 'Sports story', categories: ['Sports']}),
		]

		await render(<NewsList query={makeQuery({data: stories})} thumbnail={false} />)

		expect(screen.getByText('Categories')).toBeTruthy()
		expect(screen.queryByRole('button')).toBeNull()
	})
})
