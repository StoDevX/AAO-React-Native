import React from 'react'
import {render, screen} from '@testing-library/react-native'
import type {UseQueryResult} from '@tanstack/react-query'
import {PostList} from '../post-list'
import type {RedditPostType} from '../types'

jest.mock('@react-native-vector-icons/ionicons', () => ({Ionicons: 'Icon'}))

const makePost = (overrides: Partial<RedditPostType> = {}): RedditPostType => ({
	id: 'post-1',
	title: 'Test post title',
	author: 'test_user',
	publishedAt: '2024-01-15T12:00:00Z',
	permalink: 'https://reddit.com/r/stolaf/comments/abc/test',
	contentHtml: '<p>Post content</p>',
	thumbnail: null,
	...overrides,
})

function makeQuery(
	overrides: Partial<UseQueryResult<RedditPostType[]>>,
): UseQueryResult<RedditPostType[]> {
	return {
		data: [],
		error: null,
		isLoading: false,
		isError: false,
		isRefetching: false,
		refetch: jest.fn(),
		...overrides,
	} as unknown as UseQueryResult<RedditPostType[]>
}

describe('PostList', () => {
	it('renders post titles when data is available', () => {
		const posts = [
			makePost({id: 'p1', title: 'First post about Olaf'}),
			makePost({id: 'p2', title: 'Second post about Carleton'}),
		]
		render(
			<PostList onPressPost={jest.fn()} query={makeQuery({data: posts})} />,
		)
		expect(screen.getByText('First post about Olaf')).toBeTruthy()
		expect(screen.getByText('Second post about Carleton')).toBeTruthy()
	})

	it('renders loading indicator while loading', () => {
		render(
			<PostList
				onPressPost={jest.fn()}
				query={makeQuery({isLoading: true, data: undefined})}
			/>,
		)
		expect(screen.getByText('Loading…')).toBeTruthy()
	})

	it('renders error message when query fails', () => {
		render(
			<PostList
				onPressPost={jest.fn()}
				query={makeQuery({
					isError: true,
					error: new Error('Network error'),
				})}
			/>,
		)
		expect(screen.getByText(/A problem occurred while loading/u)).toBeTruthy()
	})
})
