import {EMPTY_CAPTIONS, MAX_CAPTION_LINES, reduceCaptions} from '../reduce-captions'

describe('reduceCaptions', () => {
	test('a volatile update replaces the live line', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'volatile', text: 'good eve'})
		state = reduceCaptions(state, {kind: 'volatile', text: 'good evening'})
		expect(state.live).toBe('good evening')
		expect(state.lines).toEqual([])
	})

	test('a final update becomes a line and clears the live one', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'volatile', text: 'good evening'})
		state = reduceCaptions(state, {kind: 'final', text: 'Good evening.'})
		expect(state.lines.map((line) => line.text)).toEqual(['Good evening.'])
		expect(state.live).toBe('')
	})

	test('a blank final adds no line', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'final', text: '  '})
		expect(state.lines).toEqual([])
	})

	test('history is capped, and ids stay unique', () => {
		let state = EMPTY_CAPTIONS
		for (let index = 0; index < MAX_CAPTION_LINES + 5; index++) {
			state = reduceCaptions(state, {kind: 'final', text: `line ${index}`})
		}
		expect(state.lines).toHaveLength(MAX_CAPTION_LINES)
		expect(state.lines[0]?.text).toBe('line 5')
		expect(new Set(state.lines.map((line) => line.id)).size).toBe(MAX_CAPTION_LINES)
	})

	test('clearLive drops the in-progress line but keeps history', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'final', text: 'One.'})
		state = reduceCaptions(state, {kind: 'volatile', text: 'two'})
		state = reduceCaptions(state, {kind: 'clearLive'})
		expect(state.live).toBe('')
		expect(state.lines).toHaveLength(1)
	})

	test('reset forgets everything', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'final', text: 'One.'})
		expect(reduceCaptions(state, {kind: 'reset'})).toEqual(EMPTY_CAPTIONS)
	})

	test('exactly the maximum number of lines drops nothing', () => {
		let state = EMPTY_CAPTIONS
		for (let index = 0; index < MAX_CAPTION_LINES; index++) {
			state = reduceCaptions(state, {kind: 'final', text: `line ${index}`})
		}
		expect(state.lines).toHaveLength(MAX_CAPTION_LINES)
		expect(state.lines[0]?.text).toBe('line 0')
	})

	test('ids keep rising past the cap', () => {
		let state = EMPTY_CAPTIONS
		let finals = MAX_CAPTION_LINES + 5
		for (let index = 0; index < finals; index++) {
			state = reduceCaptions(state, {kind: 'final', text: `line ${index}`})
		}
		let ids = state.lines.map((line) => line.id)
		expect(ids).toEqual([...ids].sort((a, b) => a - b))
		expect(ids.at(-1)).toBe(finals - 1)
	})

	test('a final after clearLive becomes a line', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'volatile', text: 'one'})
		state = reduceCaptions(state, {kind: 'clearLive'})
		state = reduceCaptions(state, {kind: 'final', text: 'One.'})
		expect(state.lines.map((line) => line.text)).toEqual(['One.'])
	})

	test('does not change the state it is given', () => {
		let state = reduceCaptions(EMPTY_CAPTIONS, {kind: 'final', text: 'One.'})
		let frozen = Object.freeze({
			...state,
			lines: Object.freeze(state.lines.map((line) => Object.freeze(line))) as typeof state.lines,
		})
		for (let action of [
			{kind: 'volatile', text: 'two'},
			{kind: 'final', text: 'Two.'},
			{kind: 'clearLive'},
			{kind: 'reset'},
		] as const) {
			expect(() => reduceCaptions(frozen, action)).not.toThrow()
		}
	})
})
