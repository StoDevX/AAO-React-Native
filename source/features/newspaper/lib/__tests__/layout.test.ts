import {describe, expect, it} from '@jest/globals'
import posts from '../../__tests__/fixtures/posts.json'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import variety from '../../__tests__/fixtures/variety-posts.json'
import crosswordPlaylist from '../../__tests__/fixtures/crossword-playlist-posts.json'
import recipeFeature from '../../__tests__/fixtures/recipe-feature-posts.json'
import {parseBlocks} from '../blocks'
import {parseMessCategories, parseMessPosts} from '../posts'
import {chooseLayout} from '../layout'
import type {Block} from '../../types'
import {MESSENGER} from '../../../../campuses/edu-stolaf/paper'

let varietyStories = parseMessPosts(variety, parseMessCategories(categoriesJson), MESSENGER)
let puzzleStories = parseMessPosts(
	crosswordPlaylist,
	parseMessCategories(categoriesJson),
	MESSENGER,
)
let recipeFeatureStories = parseMessPosts(
	recipeFeature,
	parseMessCategories(categoriesJson),
	MESSENGER,
)

describe('chooseLayout', () => {
	it('lays a Photo story out around its pictures, taking them out of the body', () => {
		let story = recipeFeatureStories.find((s) => s.id === 36845)
		expect(story?.layout).toStrictEqual({
			kind: 'feature',
			images: [
				{
					url: 'https://olafmessenger.com/wp-content/uploads/2026/04/IMG_7781.jpg',
					width: 1501,
					height: 2001,
					caption: '',
				},
			],
		})
		expect(recipeFeatureStories.find((s) => s.id === 33129)?.blocks).toHaveLength(1)
	})

	it('lays a Short Story with no picture out as a feature with none', () => {
		let story = recipeFeatureStories.find((s) => s.id === 36835)
		expect(story?.layout).toStrictEqual({kind: 'feature', images: []})
		expect(story?.blocks.length).toBeGreaterThan(0)
	})

	it('lays a Photo story with neither picture nor words out as a feature', () => {
		expect(chooseLayout({column: 'Photo', blocks: [], photo: null, html: ''})).toStrictEqual({
			layout: {kind: 'feature', images: []},
			blocks: [],
		})
	})

	it('lays a Recipes story out in sections, keeping its body for the article', () => {
		let html = recipeFeature.find((p) => p.id === 36493)?.content.rendered ?? ''
		let blocks = parseBlocks(html)
		let chosen = chooseLayout({column: 'Recipes', blocks, photo: null, html})
		expect(chosen.layout.kind).toBe('recipe')
		expect(chosen.blocks).toBe(blocks)
	})

	it('keeps a Recipes story with no steps as an article', () => {
		let blocks: Block[] = [
			{type: 'paragraph', runs: [{text: 'Ingredients:'}]},
			{type: 'paragraph', runs: [{text: '1 egg'}]},
		]
		expect(chooseLayout({column: 'Recipes', blocks, photo: null, html: ''}).layout).toStrictEqual({
			kind: 'article',
		})
	})

	it('lays a Playlist story out around its Spotify reference', () => {
		let story = puzzleStories.find((s) => s.id === 30713)
		expect(story?.layout).toStrictEqual({
			kind: 'playlist',
			spotify: {kind: 'playlist', id: '6bscojNnnO6nZcAnnXI1Cs'},
		})
		expect(story?.blocks).toHaveLength(1)
	})

	it('lays a Playlist story with an empty body out with no reference yet', () => {
		expect(puzzleStories.find((s) => s.id === 36532)?.layout).toStrictEqual({
			kind: 'playlist',
			spotify: null,
		})
	})

	it('lays a Crossword story out around its puzzle', () => {
		let story = puzzleStories.find((s) => s.id === 36814)
		expect(story?.layout).toStrictEqual({
			kind: 'puzzle',
			puzzle: {
				type: 'crossword',
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

	it('lays a Puzzle story out around its puzzle', () => {
		let chosen = chooseLayout({
			column: 'Puzzle',
			blocks: [],
			photo: null,
			html: '<div class="pm-embed-div" data-id="9d6dbf85" data-set="1977" data-puzzletype="wordrow"></div>',
		})
		expect(chosen.layout).toStrictEqual({
			kind: 'puzzle',
			puzzle: {type: 'wordrow', id: '9d6dbf85', set: '1977'},
		})
		expect(chosen.blocks).toStrictEqual([])
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

	it("gives the image layout the featured photo's caption", () => {
		let photo = {url: 'https://example.com/p.png', width: 800, height: 600, caption: 'Week 3'}
		let chosen = chooseLayout({column: 'Comic', blocks: [], photo, html: ''})
		expect(chosen.layout).toStrictEqual({kind: 'image', image: photo})
	})

	it("keeps the featured photo's alt text beside its caption", () => {
		let photo = {
			url: 'https://example.com/p.png',
			width: 800,
			height: 600,
			caption: '',
			alt: "A Shoe's Journey by Zoe Esterly",
		}
		let chosen = chooseLayout({column: 'Artwork', blocks: [], photo, html: ''})
		expect(chosen.layout).toStrictEqual({kind: 'image', image: photo})
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
			image: {url: 'https://example.com/c.png', width: 600, height: 400, caption: 'A comic'},
		})
		expect(chosen.blocks).toStrictEqual([paragraph])
	})

	it('keeps the largest copy of a comic’s inline image', () => {
		let figure: Block = {
			type: 'figure',
			url: 'https://example.com/c-600x400.png',
			largeUrl: 'https://example.com/c.png',
			width: 600,
			height: 400,
			caption: 'A comic',
		}
		let chosen = chooseLayout({column: 'Comic', blocks: [figure], photo: null, html: ''})
		expect(chosen.layout).toStrictEqual({
			kind: 'image',
			image: {
				url: 'https://example.com/c-600x400.png',
				largeUrl: 'https://example.com/c.png',
				width: 600,
				height: 400,
				caption: 'A comic',
			},
		})
	})

	it("keeps a comic's alt text beside its figcaption", () => {
		let figure: Block = {
			type: 'figure',
			url: 'https://example.com/c.png',
			width: 600,
			height: 400,
			caption: '',
			alt: 'A strip about midterms',
		}
		let chosen = chooseLayout({column: 'Comic', blocks: [figure], photo: null, html: ''})
		expect(chosen.layout).toStrictEqual({
			kind: 'image',
			image: {
				url: 'https://example.com/c.png',
				width: 600,
				height: 400,
				caption: '',
				alt: 'A strip about midterms',
			},
		})
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
	it('sets a layout on every story, from its column', () => {
		let stories = parseMessPosts(posts, parseMessCategories(categoriesJson), MESSENGER)
		expect(stories.map((s) => [s.id, s.layout.kind])).toStrictEqual([
			[36859, 'article'],
			[36911, 'article'],
			[36885, 'article'],
			[36904, 'article'],
			[36843, 'playlist'],
		])
	})
})
