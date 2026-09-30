import {formatMiles, goodToKnowRows} from '../good-to-know'

const base = {abbreviation: null, nickname: '', accessibility: 'unknown' as const}

describe('goodToKnowRows', () => {
	it('is empty with nothing to say', () => {
		expect(goodToKnowRows(base)).toEqual([])
	})

	it('names the abbreviation', () => {
		expect(goodToKnowRows({...base, abbreviation: 'RNS', nickname: 'RNS'})).toEqual([
			{kind: 'abbreviation', text: 'Abbreviated RNS'},
		])
	})

	it('shows a nickname that differs from the abbreviation', () => {
		expect(goodToKnowRows({...base, nickname: 'The Pause'})).toEqual([
			{kind: 'nickname', text: 'The Pause', others: []},
		])
	})

	it('takes a list of names, first as the row, the rest beneath, dropping the abbreviation and repeats', () => {
		let rows = goodToKnowRows({
			...base,
			abbreviation: 'FJH',
			nickname: ['FJH', 'Food Justice House', 'Ecology House', 'Food Justice House'],
		})
		expect(rows).toEqual([
			{kind: 'abbreviation', text: 'Abbreviated FJH'},
			{kind: 'nickname', text: 'Food Justice House', others: ['Ecology House']},
		])
	})

	// The feed is not validated at the boundary, so a record can omit it.
	it('copes with a nickname the feed left out', () => {
		expect(goodToKnowRows({...base, nickname: undefined as never})).toEqual([])
	})

	it('ignores blank names', () => {
		expect(goodToKnowRows({...base, nickname: ['  ', '']})).toEqual([])
	})

	it.each([
		['wheelchair', 'Wheelchair accessible', true],
		['none', 'Not wheelchair accessible', false],
	] as const)('states accessibility %s', (value, text, accessible) => {
		expect(goodToKnowRows({...base, accessibility: value})).toEqual([
			{kind: 'accessibility', text, accessible},
		])
	})

	it("gives a trail's length in miles", () => {
		expect(goodToKnowRows({...base, length: 1317})).toEqual([{kind: 'length', text: '0.8 mi'}])
	})

	it('says nothing of a length it does not have', () => {
		expect(goodToKnowRows({...base, length: null})).toEqual([])
		expect(goodToKnowRows({...base, length: undefined})).toEqual([])
		expect(goodToKnowRows({...base, length: 0})).toEqual([])
	})
})

describe('formatMiles', () => {
	it('rounds to a tenth of a mile', () => {
		expect(formatMiles(1528.9)).toBe('1.0 mi') // 0.95 mi
		expect(formatMiles(820)).toBe('0.5 mi')
	})

	it('never says zero for a trail that exists', () => {
		expect(formatMiles(50)).toBe('0.1 mi')
		expect(formatMiles(80.47)).toBe('0.1 mi') // 0.05 mi
	})
})
