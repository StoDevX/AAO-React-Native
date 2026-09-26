import {describe, expect, it} from '@jest/globals'
import variety from '../../__tests__/fixtures/variety-posts.json'
import {parseBlocks} from '../blocks'
import {parseHoroscopes, SIGN_GLYPHS} from '../horoscopes'
import {ZODIAC_SIGNS} from '../zodiac'
import type {Block} from '../../types'

const blocksOf = (id: number): Block[] =>
	parseBlocks(variety.find((p) => p.id === id)?.content.rendered ?? '')

const text = (runs: Array<{text: string}>) => runs.map((r) => r.text).join('')

describe('parseHoroscopes', () => {
	it('reads a post with bold labels that starts at Aries', () => {
		let layout = parseHoroscopes(blocksOf(36518))
		expect(layout.kind).toBe('horoscopes')
		if (layout.kind !== 'horoscopes') return
		expect(layout.signs.map((s) => s.sign)).toStrictEqual([...ZODIAC_SIGNS])
		expect(layout.signs.every((s) => s.reading.length > 0)).toBe(true)
	})

	it('reads a post with plain labels that starts at Capricorn, in zodiac order', () => {
		let layout = parseHoroscopes(blocksOf(36775))
		expect(layout.kind).toBe('horoscopes')
		if (layout.kind !== 'horoscopes') return
		expect(layout.signs.map((s) => s.sign)).toStrictEqual([...ZODIAC_SIGNS])
		expect(layout.intro).toStrictEqual([])
		let capricorn = layout.signs.find((s) => s.sign === 'capricorn')
		expect(text(capricorn?.reading[0] ?? [])).toBe(
			'This spring break, you will reconnect with your inner self. Take time to relax and enjoy the space to think.',
		)
	})

	it('reads a post with no intro that starts at Gemini, in zodiac order', () => {
		let layout = parseHoroscopes(blocksOf(36233))
		expect(layout.kind).toBe('horoscopes')
		if (layout.kind !== 'horoscopes') return
		expect(layout.intro).toStrictEqual([])
		expect(layout.signs.map((s) => s.sign)).toStrictEqual([...ZODIAC_SIGNS])
	})

	it('removes the label and colon from a reading', () => {
		let layout = parseHoroscopes(blocksOf(36518))
		if (layout.kind !== 'horoscopes') throw new Error('expected horoscopes')
		let first = text(layout.signs[0]?.reading[0] ?? [])
		expect(first).not.toMatch(/^\s*aries\s*:/iu)
		expect(first.startsWith(' ')).toBe(false)
	})

	it('recognises a label with the colon inside the bold', () => {
		let blocks: Block[] = ZODIAC_SIGNS.map((sign) => ({
			type: 'paragraph',
			runs: [{text: `${sign}:`, bold: true}, {text: ' a reading'}],
		}))
		let layout = parseHoroscopes(blocks)
		if (layout.kind !== 'horoscopes') throw new Error('expected horoscopes')
		expect(layout.signs.map((s) => text(s.reading[0] ?? []))).toStrictEqual(
			ZODIAC_SIGNS.map(() => 'a reading'),
		)
	})

	it('recognises a label split across runs', () => {
		let blocks: Block[] = ZODIAC_SIGNS.map((sign) => ({
			type: 'paragraph',
			runs: [{text: sign.slice(0, 3), bold: true}, {text: `${sign.slice(3)}: a reading`}],
		}))
		let layout = parseHoroscopes(blocks)
		if (layout.kind !== 'horoscopes') throw new Error('expected horoscopes')
		expect(layout.signs.map((s) => text(s.reading[0] ?? []))).toStrictEqual(
			ZODIAC_SIGNS.map(() => 'a reading'),
		)
	})

	it('keeps paragraphs before the first sign as the intro', () => {
		let blocks: Block[] = [
			{type: 'paragraph', runs: [{text: 'Congratulations, you are a citrus fruit now!'}]},
			...ZODIAC_SIGNS.map((sign): Block => ({type: 'paragraph', runs: [{text: `${sign}: go`}]})),
		]
		let layout = parseHoroscopes(blocks)
		if (layout.kind !== 'horoscopes') throw new Error('expected horoscopes')
		expect(layout.intro.map(text)).toStrictEqual(['Congratulations, you are a citrus fruit now!'])
	})

	it('keeps italics in a reading', () => {
		let blocks: Block[] = ZODIAC_SIGNS.map((sign) => ({
			type: 'paragraph',
			runs: [{text: `${sign}: read `}, {text: 'this', italic: true}],
		}))
		let layout = parseHoroscopes(blocks)
		if (layout.kind !== 'horoscopes') throw new Error('expected horoscopes')
		expect(layout.signs[0]?.reading[0]).toContainEqual({text: 'this', italic: true})
	})

	it('keeps a list or a quote inside a reading as paragraphs of it', () => {
		let blocks: Block[] = ZODIAC_SIGNS.flatMap((sign): Block[] => [
			{type: 'paragraph', runs: [{text: `${sign}: go`}]},
			{type: 'list', ordered: false, items: [[{text: `${sign} one`}], [{text: `${sign} two`}]]},
			{type: 'quote', runs: [{text: `${sign} said`}]},
		])
		let layout = parseHoroscopes(blocks)
		if (layout.kind !== 'horoscopes') throw new Error('expected horoscopes')
		expect(layout.signs[0]?.reading.map(text)).toStrictEqual([
			'go',
			'aries one',
			'aries two',
			'aries said',
		])
	})

	it('falls back to an article when a sign is missing', () => {
		let blocks: Block[] = ZODIAC_SIGNS.slice(1).map((sign) => ({
			type: 'paragraph',
			runs: [{text: `${sign}: go`}],
		}))
		expect(parseHoroscopes(blocks)).toStrictEqual({kind: 'article'})
	})

	it('falls back to an article when a sign appears twice', () => {
		let blocks: Block[] = [...ZODIAC_SIGNS, 'aries' as const].map((sign) => ({
			type: 'paragraph',
			runs: [{text: `${sign}: go`}],
		}))
		expect(parseHoroscopes(blocks)).toStrictEqual({kind: 'article'})
	})
})

describe('SIGN_GLYPHS', () => {
	it('draws each sign as its zodiac character in text presentation', () => {
		expect(SIGN_GLYPHS.aries).toBe('\u2648\uFE0E')
		expect(SIGN_GLYPHS.pisces).toBe('\u2653\uFE0E')
	})
})
