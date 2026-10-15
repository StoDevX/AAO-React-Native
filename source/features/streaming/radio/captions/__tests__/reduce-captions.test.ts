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
})
