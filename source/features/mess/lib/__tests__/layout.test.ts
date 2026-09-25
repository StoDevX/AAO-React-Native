import {describe, expect, it} from '@jest/globals'
import posts from '../../__tests__/fixtures/posts.json'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import variety from '../../__tests__/fixtures/variety-posts.json'
import {parseBlocks} from '../blocks'
import {parseMessCategories, parseMessPosts} from '../posts'
import {chooseLayout} from '../layout'

describe('chooseLayout', () => {
	it('gives a column with no template the article layout', () => {
		expect(
			chooseLayout({column: 'StoReview', blocks: [], photo: null, html: ''}).layout,
		).toStrictEqual({kind: 'article'})
	})

	it('lays out a Horoscopes story sign by sign', () => {
		let blocks = parseBlocks(variety.find((p) => p.id === 36518)?.content.rendered ?? '')
		let chosen = chooseLayout({column: 'Horoscopes', blocks, photo: null, html: ''})
		expect(chosen.layout.kind).toBe('horoscopes')
		expect(chosen.blocks).toBe(blocks)
	})

	it('lays out a Poetry story line by line from its raw HTML', () => {
		let html = variety.find((p) => p.id === 36280)?.content.rendered ?? ''
		let blocks = parseBlocks(html)
		let chosen = chooseLayout({column: 'Poetry', blocks, photo: null, html})
		expect(chosen.layout.kind).toBe('poem')
		expect(chosen.blocks).toBe(blocks)
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
