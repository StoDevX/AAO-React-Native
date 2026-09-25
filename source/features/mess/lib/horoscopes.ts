import type {Block, Run, StoryLayout, ZodiacSign} from '../types'
import {ZODIAC_SIGNS} from './zodiac'

/** A sign's name as the reader sees it. */
export const SIGN_NAMES: Record<ZodiacSign, string> = {
	aries: 'Aries',
	taurus: 'Taurus',
	gemini: 'Gemini',
	cancer: 'Cancer',
	leo: 'Leo',
	virgo: 'Virgo',
	libra: 'Libra',
	scorpio: 'Scorpio',
	sagittarius: 'Sagittarius',
	capricorn: 'Capricorn',
	aquarius: 'Aquarius',
	pisces: 'Pisces',
}

/** The usual dates for each sign; the Mess's posts don't give them. */
export const SIGN_DATES: Record<ZodiacSign, string> = {
	aries: 'Mar 21 – Apr 19',
	taurus: 'Apr 20 – May 20',
	gemini: 'May 21 – Jun 20',
	cancer: 'Jun 21 – Jul 22',
	leo: 'Jul 23 – Aug 22',
	virgo: 'Aug 23 – Sep 22',
	libra: 'Sep 23 – Oct 22',
	scorpio: 'Oct 23 – Nov 21',
	sagittarius: 'Nov 22 – Dec 21',
	capricorn: 'Dec 22 – Jan 19',
	aquarius: 'Jan 20 – Feb 18',
	pisces: 'Feb 19 – Mar 20',
}

/** Each sign's symbol, with U+FE0E so it draws as text rather than emoji. */
export const SIGN_GLYPHS: Record<ZodiacSign, string> = Object.fromEntries(
	ZODIAC_SIGNS.map((sign, index) => [sign, `${String.fromCodePoint(0x2648 + index)}\uFE0E`]),
) as Record<ZodiacSign, string>

/** A sign's name, optional spaces and a colon at the start of a paragraph, with the spaces after it. */
const LABEL = new RegExp(`^\\s*(${ZODIAC_SIGNS.join('|')})\\s*:\\s*`, 'iu')

/** The runs with their first `length` characters removed, dropping runs left empty. */
function dropPrefix(runs: Run[], length: number): Run[] {
	let rest: Run[] = []
	let remaining = length
	for (let run of runs) {
		if (remaining >= run.text.length) {
			remaining -= run.text.length
			continue
		}
		rest.push({...run, text: run.text.slice(remaining)})
		remaining = 0
	}
	return rest
}

/**
 * A Horoscopes post as twelve readings in zodiac order, with any paragraphs
 * before the first sign as the intro. Every sign must appear exactly once, or
 * the post is drawn as an article.
 */
export function parseHoroscopes(blocks: Block[]): StoryLayout {
	let intro: Run[][] = []
	let readings = new Map<ZodiacSign, Run[][]>()
	let current: Run[][] | null = null

	for (let block of blocks) {
		if (block.type !== 'paragraph') {
			// Lists and quotes inside a reading keep their words as a paragraph.
			if (block.type === 'list') for (let item of block.items) (current ?? intro).push(item)
			if (block.type === 'quote') (current ?? intro).push(block.runs)
			continue
		}
		let plain = block.runs.map((r) => r.text).join('')
		let match = LABEL.exec(plain)
		if (match) {
			let sign = match[1]?.toLowerCase() as ZodiacSign
			if (readings.has(sign)) return {kind: 'article'}
			current = []
			readings.set(sign, current)
			let rest = dropPrefix(block.runs, match[0].length)
			if (rest.length > 0) current.push(rest)
			continue
		}
		;(current ?? intro).push(block.runs)
	}

	if (readings.size !== ZODIAC_SIGNS.length) return {kind: 'article'}
	return {
		kind: 'horoscopes',
		intro,
		signs: ZODIAC_SIGNS.map((sign) => ({sign, reading: readings.get(sign) ?? []})),
	}
}
