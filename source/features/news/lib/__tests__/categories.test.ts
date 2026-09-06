import {describe, expect, it} from '@jest/globals'
import type {StoryType} from '../../types'
import {extractCategories, filterByCategory, resolveCategory} from '../util'

let story = (props: Partial<StoryType>): StoryType => ({
	authors: [],
	categories: [],
	content: '',
	excerpt: 'excerpt',
	title: 'title',
	...props,
})

describe('extractCategories', () => {
	it('should list each category once, sorted A-Z', () => {
		let stories = [story({categories: ['Sports', 'Academics']}), story({categories: ['Sports']})]
		expect(extractCategories(stories)).toStrictEqual(['Academics', 'Sports'])
	})

	it('should tidy categories the same way the rows do', () => {
		expect(extractCategories([story({categories: ['student   life']})])).toStrictEqual([
			'Student Life',
		])
	})

	it('should tolerate stories with no categories', () => {
		let noCategories = {...story({}), categories: undefined} as unknown as StoryType
		expect(extractCategories([noCategories])).toStrictEqual([])
	})

	it('should read every story it is given, cleaning happening upstream', () => {
		let wouldBeCleaned = story({categories: ['Sports'], content: '<form>', excerpt: ' '})
		expect(extractCategories([wouldBeCleaned])).toStrictEqual(['Sports'])
	})
})

describe('filterByCategory', () => {
	let sports = story({categories: ['Sports'], title: 'sports story'})
	let academics = story({categories: ['Academics'], title: 'academics story'})

	it('should keep every story when no category is chosen', () => {
		expect(filterByCategory([sports, academics], null)).toStrictEqual([sports, academics])
	})

	it('should keep only the stories carrying the category', () => {
		expect(filterByCategory([sports, academics], 'Sports')).toStrictEqual([sports])
	})

	it('should match on the tidied category', () => {
		let untidy = story({categories: ['student   life']})
		expect(filterByCategory([untidy], 'Student Life')).toStrictEqual([untidy])
	})

	it('should tolerate stories with no categories', () => {
		let noCategories = {...story({}), categories: undefined} as unknown as StoryType
		expect(filterByCategory([noCategories], 'Sports')).toStrictEqual([])
	})
})

describe('resolveCategory', () => {
	it('should keep a category the feed still carries', () => {
		expect(resolveCategory('Sports', ['Academics', 'Sports'])).toBe('Sports')
	})

	it('should drop a category the feed no longer carries', () => {
		expect(resolveCategory('Athletics', ['Academics', 'Sports'])).toBeNull()
	})

	it('should drop any category when the feed offers none', () => {
		expect(resolveCategory('Sports', [])).toBeNull()
	})

	it('should leave an unset category unset', () => {
		expect(resolveCategory(null, ['Sports'])).toBeNull()
	})
})
