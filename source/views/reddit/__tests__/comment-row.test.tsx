// source/views/reddit/__tests__/comment-row.test.tsx
import React from 'react'
import {render, screen} from '@testing-library/react-native'
import {CommentRow} from '../comment-row'
import type {RedditCommentType} from '../types'

const makeComment = (overrides: Partial<RedditCommentType> = {}): RedditCommentType => ({
	id: 'test-id',
	author: 'test_author',
	contentHtml: '<p>Hello world</p>',
	publishedAt: '2024-01-15T12:00:00Z',
	replies: [],
	...overrides,
})

describe('CommentRow', () => {
	it('renders the author name', () => {
		render(<CommentRow comment={makeComment({author: 'ole_fan'})} depth={0} />)
		expect(screen.getByText(/ole_fan/)).toBeTruthy()
	})

	it('renders stripped comment text', () => {
		render(<CommentRow comment={makeComment({contentHtml: '<p>Hello world</p>'})} depth={0} />)
		expect(screen.getByText(/Hello world/)).toBeTruthy()
	})

	it('renders nested replies', () => {
		const comment = makeComment({
			replies: [
				makeComment({id: 'child-1', author: 'child_user', contentHtml: '<p>Child reply</p>'}),
			],
		})
		render(<CommentRow comment={comment} depth={0} />)
		expect(screen.getByText(/child_user/)).toBeTruthy()
		expect(screen.getByText(/Child reply/)).toBeTruthy()
	})

	it('mounts at depth 2 without crashing', () => {
		render(<CommentRow comment={makeComment()} depth={2} testID="comment-depth-2" />)
		expect(screen.getByTestId('comment-depth-2')).toBeTruthy()
	})
})