import {describe, expect, test} from '@jest/globals'

import {captionRows, splitWords} from '../caption-rows'
import {EMPTY_CAPTIONS, reduceCaptions} from '../reduce-captions'

describe('captionRows', () => {
	test('keys settled lines by their ids, which are unique', () => {
		let state = [
			{kind: 'final', text: 'one'},
			{kind: 'final', text: 'two'},
			{kind: 'final', text: 'three'},
		] as const
		let rows = captionRows(state.reduce(reduceCaptions, EMPTY_CAPTIONS))

		expect(rows.map((row) => row.text)).toEqual(['one', 'two', 'three'])
		expect(rows.every((row) => !row.live)).toBe(true)
		expect(new Set(rows.map((row) => row.key)).size).toBe(3)
	})

	test('adds no row for an empty live line', () => {
		let settled = reduceCaptions(EMPTY_CAPTIONS, {kind: 'final', text: 'one'})

		expect(captionRows(settled)).toHaveLength(1)
	})

	test('keeps the live line’s key when it settles, so the row is not remounted', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'final', text: 'first'})
		state = reduceCaptions(state, {kind: 'volatile', text: 'second line so'})
		let live = captionRows(state).at(-1)

		state = reduceCaptions(state, {kind: 'final', text: 'second line so far'})
		let settled = captionRows(state).at(-1)

		expect(live?.live).toBe(true)
		expect(settled?.live).toBe(false)
		expect(live?.text).toBe('second line so')
		expect(settled?.text).toBe('second line so far')
		expect(settled?.key).toBe(live?.key)
	})

	test('gives the live line the next id again after it is cleared', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'final', text: 'first'})
		state = reduceCaptions(state, {kind: 'volatile', text: 'half a'})
		let before = captionRows(state).at(-1)
		state = reduceCaptions(state, {kind: 'clearLive'})
		state = reduceCaptions(state, {kind: 'volatile', text: 'another'})

		expect(captionRows(state).at(-1)?.key).toBe(before?.key)
	})
})

describe('captionRows markers', () => {
	test('says which rows are markers, and of what kind', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'final', text: 'one'})
		state = reduceCaptions(state, {kind: 'music'})
		state = reduceCaptions(state, {kind: 'final', text: 'two'})
		state = reduceCaptions(state, {kind: 'gap'})

		expect(captionRows(state).map((row) => row.marker)).toEqual([null, 'music', null, 'gap'])
	})
})

describe('splitWords', () => {
	test('splits on runs of spaces, ignoring leading and trailing ones', () => {
		expect(splitWords('  and   now the  news ')).toEqual(['and', 'now', 'the', 'news'])
	})

	test('has no words for an empty or blank line', () => {
		expect(splitWords('')).toEqual([])
		expect(splitWords('   ')).toEqual([])
	})
})
