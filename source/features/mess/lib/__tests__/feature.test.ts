import {describe, expect, it} from '@jest/globals'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import fixtures from '../../__tests__/fixtures/recipe-feature-posts.json'
import type {Block, CaptionedPhoto} from '../../types'
import {parseBlocks} from '../blocks'
import {parseFeature} from '../feature'
import {parseMessCategories, parseMessPosts} from '../posts'

const stories = parseMessPosts(fixtures, parseMessCategories(categoriesJson))

/** The old St. Olaf pages site, which the older posts' body pictures still name. */
const PAGES = 'https://pages.stolaf.edu/messenger/wp-content/uploads/sites'

/** A fixture post's featured photo and body, as `chooseLayout` receives them. */
function post(id: number): [CaptionedPhoto | null, Block[]] {
	let photo = stories.find((s) => s.id === id)?.photo ?? null
	let html = fixtures.find((p) => p.id === id)?.content.rendered ?? ''
	return [photo, parseBlocks(html)]
}

describe('parseFeature', () => {
	it('takes the featured photo (36845)', () => {
		expect(parseFeature(...post(36845))).toStrictEqual({
			images: [
				{
					url: 'https://olafmessenger.com/wp-content/uploads/2026/04/IMG_7781.jpg',
					width: 1501,
					height: 2001,
					caption: '',
				},
			],
			blocks: [],
		})
	})

	it('takes a picture out of the body, and leaves the words (27297)', () => {
		let {images, blocks} = parseFeature(...post(27297))
		expect(images).toStrictEqual([
			{
				url: `${PAGES}/1036/2020/09/Humans-of-St.-Olaf-Emma--169x300.jpg`,
				width: 169,
				height: 300,
				caption: '',
			},
		])
		expect(blocks).toHaveLength(1)
		expect(blocks[0]?.type).toBe('paragraph')
	})

	// Hand-written: no live Photo post's body picture has a caption.
	it("keeps a body picture's caption", () => {
		let figure: Block = {
			type: 'figure',
			url: 'https://olafmessenger.com/wp-content/uploads/2024/05/bees.jpg',
			width: 600,
			height: 400,
			caption: 'Bees at the cup',
		}
		expect(parseFeature(null, [figure]).images).toStrictEqual([
			{
				url: 'https://olafmessenger.com/wp-content/uploads/2024/05/bees.jpg',
				width: 600,
				height: 400,
				caption: 'Bees at the cup',
			},
		])
	})

	it('takes every picture of a set, in order (33129)', () => {
		expect(parseFeature(...post(33129))).toStrictEqual({
			images: [
				{url: `${PAGES}/1536/2023/12/IMG_0393-300x200.jpg`, width: 300, height: 200, caption: ''},
				{url: `${PAGES}/1536/2023/12/IMG_0489-300x200.jpg`, width: 300, height: 200, caption: ''},
			],
			blocks: [
				{
					type: 'paragraph',
					runs: [{text: 'By Megan Lu\n'}, {text: 'Photo Director', italic: true}],
				},
			],
		})
	})

	it('draws a featured photo the body repeats at another size once (29162)', () => {
		let {images, blocks} = parseFeature(...post(29162))
		expect(images).toStrictEqual([
			{
				url: 'https://olafmessenger.com/wp-content/uploads/2021/03/strawberrymatcha.jpg',
				width: 1706,
				height: 1594,
				caption: 'Illustration by Zoe Miller',
			},
		])
		expect(blocks.some((block) => block.type === 'figure')).toBe(false)
	})

	// Hand-written: a dropped copy's caption is words the page would otherwise lose.
	it("gives the featured photo its body copy's caption when it has none", () => {
		let photo = {
			url: 'https://olafmessenger.com/wp-content/uploads/2024/05/bees.jpg',
			width: 1200,
			height: 800,
			caption: '',
		}
		let copy: Block = {
			type: 'figure',
			url: 'https://olafmessenger.com/wp-content/uploads/2024/05/bees-600x400.jpg',
			width: 600,
			height: 400,
			caption: 'Bees at the cup',
		}
		expect(parseFeature(photo, [copy]).images).toStrictEqual([
			{...photo, caption: 'Bees at the cup'},
		])
	})

	it('keeps a body picture that only shares a name with the featured photo', () => {
		let photo = {
			url: 'https://olafmessenger.com/wp-content/uploads/2024/05/bees.jpg',
			width: 1200,
			height: 800,
			caption: '',
		}
		let other: Block = {
			type: 'figure',
			url: 'https://olafmessenger.com/wp-content/uploads/2024/05/bees-2.jpg',
			width: 600,
			height: 400,
			caption: '',
		}
		expect(parseFeature(photo, [other]).images).toHaveLength(2)
	})

	it('takes only the featured photo when the body picture has no size (27829)', () => {
		expect(parseFeature(...post(27829))).toStrictEqual({
			images: [
				{
					url: 'https://olafmessenger.com/wp-content/uploads/2020/10/2449cc49-2f87-4b47-b800-d8ba61c1db4f.jpg',
					width: 1024,
					height: 522,
					caption: '',
				},
			],
			blocks: [],
		})
	})

	it('gives a story with no picture none, and leaves its words (36835)', () => {
		let [photo, blocks] = post(36835)
		expect(parseFeature(photo, blocks)).toStrictEqual({images: [], blocks})
	})
})
