import {describe, expect, test} from '@jest/globals'
import {emptyStateProps} from '../empty-state'

describe('emptyStateProps', () => {
	test('no category filter active', () => {
		expect(emptyStateProps(false)).toEqual({title: 'No news stories.'})
	})

	test('category filter active and nothing matches', () => {
		expect(emptyStateProps(true)).toEqual({
			title: 'No stories to show.',
			description: 'Try changing the filters.',
		})
	})
})
