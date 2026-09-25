import {describe, expect, it} from '@jest/globals'
import variety from '../../__tests__/fixtures/variety-posts.json'
import {parseBlocks} from '../blocks'
import {parseHoroscopes} from '../horoscopes'
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
		expect(layout.signs[0]?.sign).toBe('aries')
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
		expect(layout.kind).toBe('horoscopes')
	})

	it('recognises a label split across runs', () => {
		let blocks: Block[] = ZODIAC_SIGNS.map((sign) => ({
			type: 'paragraph',
			runs: [{text: sign.slice(0, 3), bold: true}, {text: `${sign.slice(3)}: a reading`}],
		}))
		expect(parseHoroscopes(blocks).kind).toBe('horoscopes')
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
