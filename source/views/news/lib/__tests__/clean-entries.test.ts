import {describe, expect, it} from '@jest/globals'
import {filterUnwantedStories} from '../util'

describe('filterUnwantedStories', () => {
	let rest = {authors: [], categories: [], title: ''}

	it('should remove entries with empty excerpts', () => {
		expect(
			filterUnwantedStories([{excerpt: ' ', content: 'hi bleep', ...rest}]),
		).toStrictEqual([])
	})

	it('should remove entries with <form in the content', () => {
		expect(
			filterUnwantedStories([
				{excerpt: 'blah', content: 'hi bleep <form', ...rest},
			]),
		).toStrictEqual([])
	})
})
