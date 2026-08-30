import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'
import type {UseQueryResult} from '@tanstack/react-query'

import {NewsList} from '../news-list'
import type {StoryType} from '../types'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
jest.mock('@frogpond/filter/filter-popover', () => ({FilterPopover: () => null}))

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
	test('does not mark the Categories filter as active before the reader chooses anything', async () => {
		let stories = [
			makeStory({title: 'Campus story', categories: ['Campus & Community']}),
			makeStory({title: 'Sports story', categories: ['Sports']}),
		]

		await render(<NewsList query={makeQuery({data: stories})} thumbnail={false} />)

		let button = screen.getByRole('button', {name: 'Categories'})
		expect(button.props.accessibilityState).toEqual({selected: false})
	})
})
