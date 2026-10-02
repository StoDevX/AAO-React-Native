import {describe, expect, it} from '@jest/globals'
import type {StoryType} from '../../types'
import {summarizeFeed} from '../feed'

let story = (props: Partial<StoryType>): StoryType => ({
	authors: [],
	categories: [],
	content: '',
	excerpt: 'excerpt',
	title: 'title',
	...props,
})

describe('summarizeFeed', () => {
	it('should clean the entries it hands back', () => {
		let stories = [story({title: 'kept'}), story({content: '<form>', title: 'dropped'})]
		let {entries} = summarizeFeed(stories)
		expect(entries.map((s) => s.title)).toStrictEqual(['kept'])
	})

	it('should take categories from the cleaned entries only', () => {
		let kept = story({categories: ['Arts'], title: 'kept'})
		let dropped = story({categories: ['Sports'], content: '<form>', title: 'dropped'})
		let {categories} = summarizeFeed([kept, dropped])
		expect(categories).toStrictEqual(['Arts'])
	})

	it('should give an empty feed no entries and no categories', () => {
		expect(summarizeFeed([])).toStrictEqual({entries: [], categories: []})
	})
})
