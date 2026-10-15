import {describe, expect, test} from '@jest/globals'

import {dimColor, presentCaption} from '../present-caption'

const TEXT = 'and now the evening news'

describe('presentCaption', () => {
	test('live shows every word, none dimmed', () => {
		expect(presentCaption(TEXT, {presentation: 'live', heldBackWords: 2})).toEqual({
			words: ['and', 'now', 'the', 'evening', 'news'],
			dimFrom: 5,
		})
	})

	test('hold-back drops the last words, none dimmed', () => {
		expect(presentCaption(TEXT, {presentation: 'hold-back', heldBackWords: 2})).toEqual({
			words: ['and', 'now', 'the'],
			dimFrom: 3,
		})
	})

	test('hold-back shows no words when it holds back as many as there are, or more', () => {
		expect(presentCaption('hello there', {presentation: 'hold-back', heldBackWords: 2})).toEqual({
			words: [],
			dimFrom: 0,
		})
		expect(presentCaption('hello', {presentation: 'hold-back', heldBackWords: 3})).toEqual({
			words: [],
			dimFrom: 0,
		})
	})

	test('two-tone shows every word and dims the last ones', () => {
		expect(presentCaption(TEXT, {presentation: 'two-tone', heldBackWords: 2})).toEqual({
			words: ['and', 'now', 'the', 'evening', 'news'],
			dimFrom: 3,
		})
	})

	test('two-tone dims everything when the line is shorter than the count', () => {
		expect(presentCaption('hello', {presentation: 'two-tone', heldBackWords: 3})).toEqual({
			words: ['hello'],
			dimFrom: 0,
		})
	})

	test('holding back none behaves as live in every mode', () => {
		for (let presentation of ['hold-back', 'two-tone'] as const) {
			expect(presentCaption(TEXT, {presentation, heldBackWords: 0})).toEqual(
				presentCaption(TEXT, {presentation: 'live', heldBackWords: 0}),
			)
		}
	})

	test('has no words for an empty line, and ignores extra spaces', () => {
		expect(presentCaption('', {presentation: 'two-tone', heldBackWords: 1})).toEqual({
			words: [],
			dimFrom: 0,
		})
		expect(presentCaption('  one   two ', {presentation: 'hold-back', heldBackWords: 1})).toEqual({
			words: ['one'],
			dimFrom: 1,
		})
	})
})

describe('dimColor', () => {
	test('halves the alpha of a #RRGGBBAA colour', () => {
		expect(dimColor('#FFFFFFFF')).toBe('#FFFFFF80')
		expect(dimColor('#11223340')).toBe('#11223320')
	})

	test('treats a colour with no alpha as opaque', () => {
		expect(dimColor('#FFFFFF')).toBe('#FFFFFF80')
	})
})
