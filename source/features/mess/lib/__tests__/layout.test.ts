import {describe, expect, it} from '@jest/globals'
import posts from '../../__tests__/fixtures/posts.json'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import variety from '../../__tests__/fixtures/variety-posts.json'
import crosswordPlaylist from '../../__tests__/fixtures/crossword-playlist-posts.json'
import {parseBlocks} from '../blocks'
import {parseMessCategories, parseMessPosts} from '../posts'
import {chooseLayout} from '../layout'
import type {Block} from '../../types'

let varietyStories = parseMessPosts(variety, parseMessCategories(categoriesJson))
let puzzleStories = parseMessPosts(crosswordPlaylist, parseMessCategories(categoriesJson))

describe('chooseLayout', () => {
	it('lays a Crossword story out around its puzzle', () => {
		let story = puzzleStories.find((s) => s.id === 36814)
		expect(story?.layout).toStrictEqual({
			kind: 'crossword',
			puzzle: {
				id: 'af644d78',
				set: 'c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4',
			},
		})
		expect(story?.blocks).toStrictEqual([])
	})

	it('keeps a Crossword story with no puzzle as an article, body and all', () => {
		let blocks: Block[] = [{type: 'paragraph', runs: [{text: 'No puzzle this week.'}]}]
		let chosen = chooseLayout({
			column: 'Crossword',
			blocks,
			photo: null,
			html: '<p>No puzzle this week.</p>',
		})
		expect(chosen.layout).toStrictEqual({kind: 'article'})
		expect(chosen.blocks).toBe(blocks)
	})

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

	it('lays a comic with a featured image out as an image', () => {
		let story = varietyStories.find((s) => s.id === 36819)
		expect(story?.layout).toMatchObject({kind: 'image', image: {url: story?.photo?.url}})
	})

	it('gives the image layout a photo without its caption', () => {
		let story = varietyStories.find((s) => s.id === 36819)
		expect(story?.layout.kind === 'image' && 'caption' in story.layout.image).toBe(false)
	})

	it('uses a comic’s inline image and takes it out of the body', () => {
		let story = varietyStories.find((s) => s.id === 34645)
		expect(story?.layout.kind).toBe('image')
		expect(story?.blocks.some((b) => b.type === 'figure')).toBe(false)
	})

	it('keeps the rest of a comic’s body when it takes the figure', () => {
		let figure: Block = {
			type: 'figure',
			url: 'https://example.com/c.png',
			width: 600,
			height: 400,
			caption: 'A comic',
		}
		let paragraph: Block = {type: 'paragraph', runs: [{text: 'The punchline.'}]}
		let chosen = chooseLayout({column: 'Comic', blocks: [figure, paragraph], photo: null, html: ''})
		expect(chosen.layout).toStrictEqual({
			kind: 'image',
			image: {url: 'https://example.com/c.png', width: 600, height: 400},
		})
		expect(chosen.blocks).toStrictEqual([paragraph])
	})

	it('lays artwork out as an image', () => {
		expect(varietyStories.find((s) => s.id === 36828)?.layout.kind).toBe('image')
	})

	it('keeps a comic with no image as an article', () => {
		expect(chooseLayout({column: 'Comic', blocks: [], photo: null, html: ''}).layout).toStrictEqual(
			{kind: 'article'},
		)
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
