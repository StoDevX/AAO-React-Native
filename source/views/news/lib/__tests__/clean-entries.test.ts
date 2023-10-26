import {cleanEntries} from '../util'
import {describe, expect, it} from '@jest/globals'

describe('cleanEntries', () => {
	let rest = {authors: [], categories: [], title: ''}

	it('should remove entries with empty excerpts', () => {
		expect(
			cleanEntries([{excerpt: ' ', content: 'hi bleep', ...rest}]),
		).toStrictEqual([])
	})

	it('should remove entries with <form in the content', () => {
		expect(
			cleanEntries([{excerpt: 'blah', content: 'hi bleep <form', ...rest}]),
		).toStrictEqual([])
	})
})
