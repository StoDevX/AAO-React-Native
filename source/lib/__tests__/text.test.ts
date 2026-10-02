import {describe, expect, it} from '@jest/globals'
import {deburr, words} from '../text'

describe('deburr', () => {
	it('drops accents that come off a letter', () => {
		expect(deburr('Mináǧi café Ålesund')).toBe('Minagi cafe Alesund')
	})

	it('spells out the letters that have no accent to drop', () => {
		expect(deburr('Kiŋ Øyvind Ærø straße Łódź þorn')).toBe('Kin Oyvind Aero strasse Lodz thorn')
	})

	it('leaves letters with nothing to change alone', () => {
		expect(deburr('Rolvaag 日本語')).toBe('Rolvaag 日本語')
	})
})

describe('words', () => {
	it('splits on spaces and punctuation', () => {
		expect(words('st. olaf, northfield-mn')).toEqual(['st', 'olaf', 'northfield', 'mn'])
	})

	it('splits letters from numbers, but keeps an ordinal whole', () => {
		expect(words('math252 1st 2nd 3rd 4th floor')).toEqual([
			'math',
			'252',
			'1st',
			'2nd',
			'3rd',
			'4th',
			'floor',
		])
	})

	it('keeps a contraction with its word', () => {
		expect(words("it's they’re")).toEqual(["it's", 'they’re'])
	})

	it('finds no words in punctuation alone', () => {
		expect(words(' -- ')).toEqual([])
	})
})
