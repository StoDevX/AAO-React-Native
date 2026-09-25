import {describe, expect, it} from '@jest/globals'
import posts from '../../__tests__/fixtures/posts.json'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import {parseMessCategories, parseMessPosts} from '../posts'
import {chooseLayout} from '../layout'

describe('chooseLayout', () => {
	it('gives a column with no template the article layout', () => {
		expect(
			chooseLayout({column: 'StoReview', blocks: [], photo: null, html: ''}).layout,
		).toStrictEqual({kind: 'article'})
	})

	it('gives a story with no column the article layout', () => {
		expect(chooseLayout({column: null, blocks: [], photo: null, html: ''}).layout).toStrictEqual({
			kind: 'article',
		})
	})
})

describe('parseMessPosts', () => {
	it('sets a layout on every story', () => {
		let stories = parseMessPosts(posts, parseMessCategories(categoriesJson))
		expect(stories.every((s) => s.layout.kind === 'article')).toBe(true)
	})
})
