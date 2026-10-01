import {formatDistance, formatWalkTime, goodToKnowRows} from '../good-to-know'

const base = {abbreviation: null, nickname: '', accessibility: 'unknown' as const}
const US = {languageTag: 'en-US', measurementSystem: 'us' as const}

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

	it("gives a trail's length in the device's units", () => {
		expect(goodToKnowRows({...base, length: 1317}, US)).toEqual([{kind: 'length', text: '0.8 mi'}])
	})

	it('says nothing of a length it does not have', () => {
		expect(goodToKnowRows({...base, length: null}, US)).toEqual([])
		expect(goodToKnowRows({...base, length: undefined}, US)).toEqual([])
		expect(goodToKnowRows({...base, length: 0}, US)).toEqual([])
	})
})

describe('goodToKnowRows, walks', () => {
	it("gives a walk's time and accessibility after the trail's length", () => {
		expect(
			goodToKnowRows(
				{...base, length: 1317, walk: {minutes: [14, 17], accessibility: 'Flat.'}},
				US,
			),
		).toEqual([
			{kind: 'length', text: '0.8 mi'},
			{kind: 'walk-time', text: '14–17 min walk'},
			{kind: 'walk-access', text: 'Flat.'},
		])
	})

	it('says nothing of a walk it does not have', () => {
		expect(goodToKnowRows({...base, walk: null}, US)).toEqual([])
		expect(goodToKnowRows({...base, walk: undefined}, US)).toEqual([])
	})

	it('skips the half of a walk the feed left out', () => {
		expect(
			goodToKnowRows({...base, walk: {minutes: undefined as never, accessibility: 'Flat.'}}, US),
		).toEqual([{kind: 'walk-access', text: 'Flat.'}])
		expect(goodToKnowRows({...base, walk: {minutes: [14, 17], accessibility: ' '}}, US)).toEqual([
			{kind: 'walk-time', text: '14–17 min walk'},
		])
	})
})

describe('formatWalkTime', () => {
	it('gives a range with an en dash', () => {
		expect(formatWalkTime([14, 17])).toBe('14–17 min walk')
	})

	it('gives one time when the range is one number', () => {
		expect(formatWalkTime([15, 15])).toBe('15 min walk')
	})
})

describe('formatDistance', () => {
	it('gives miles to a tenth where the device measures in miles', () => {
		expect(formatDistance(1055, US)).toBe('0.7 mi')
		expect(formatDistance(1528.9, US)).toBe('1.0 mi') // 0.95 mi
	})

	// Distances in the UK are miles, though most else is metric.
	it('gives miles in the UK', () => {
		expect(formatDistance(1055, {languageTag: 'en-GB', measurementSystem: 'uk'})).toBe('0.7 mi')
	})

	it("gives kilometres, in the language's own numbers, where the device is metric", () => {
		expect(formatDistance(1055, {languageTag: 'de-DE', measurementSystem: 'metric'})).toBe('1,1 km')
	})

	it('never says zero for a trail that exists', () => {
		expect(formatDistance(50, US)).toBe('0.1 mi')
		expect(formatDistance(20, {languageTag: 'fr-FR', measurementSystem: 'metric'})).toBe('0,1 km')
	})

	// A device that does not say goes by its region.
	it('falls back on the region when the system is unknown', () => {
		expect(formatDistance(1055, {languageTag: 'en-US', measurementSystem: null})).toBe('0.7 mi')
		expect(formatDistance(1055, {languageTag: 'fr-FR', measurementSystem: null})).toBe('1,1 km')
	})
})
