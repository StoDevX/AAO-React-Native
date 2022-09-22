import {cleanEntries} from '../util'

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
