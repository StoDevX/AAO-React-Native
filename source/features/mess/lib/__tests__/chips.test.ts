import {describe, expect, it} from '@jest/globals'
import {chipKey, chipLabel, chipOf, MESS_CHIPS} from '../chips'

describe('MESS_CHIPS', () => {
	it("offers Top, Issues, then the sections in print order, by the paper's short names", () => {
		expect(MESS_CHIPS.map(chipLabel)).toStrictEqual([
			'Top',
			'Issues',
			'News',
			'Opinions',
			'A&E',
			'Sports',
			'Variety',
		])
	})
})

describe('chipOf', () => {
	it('opens on Top with nothing saved', () => {
		expect(chipOf(null)).toStrictEqual({kind: 'top'})
	})

	it('reads back every chip it saved', () => {
		for (let chip of MESS_CHIPS) expect(chipOf(chipKey(chip))).toStrictEqual(chip)
	})

	it('keeps a section by its full name, as the old filter saved it too', () => {
		expect(chipOf('Arts & Entertainment')).toStrictEqual({
			kind: 'section',
			name: 'Arts & Entertainment',
		})
	})

	it('opens on Top for a column the old filter saved', () => {
		expect(chipOf('Poetry')).toStrictEqual({kind: 'top'})
	})
})
