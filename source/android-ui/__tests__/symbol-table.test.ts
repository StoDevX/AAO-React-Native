import {describe, expect, test} from '@jest/globals'

import {FALLBACK_SYMBOL, materialSymbolFor} from '../symbol-table'

describe('materialSymbolFor', () => {
	test('draws a decorative .fill symbol outlined, as Android does', () => {
		expect(materialSymbolFor('graduationcap.fill')).toEqual({name: 'school', filled: false})
		expect(materialSymbolFor('info.circle.fill')).toEqual({name: 'info', filled: false})
	})

	test('fills an on state, a media control and a dot', () => {
		expect(materialSymbolFor('heart.fill')).toEqual({name: 'favorite', filled: true})
		expect(materialSymbolFor('checkmark.circle.fill')).toEqual({name: 'check_circle', filled: true})
		expect(materialSymbolFor('play.fill')).toEqual({name: 'play_arrow', filled: true})
		expect(materialSymbolFor('circle.fill')).toEqual({name: 'circle', filled: true})
	})

	test('keeps their outlined form when the SF Symbol is an outline', () => {
		expect(materialSymbolFor('heart')).toEqual({name: 'favorite', filled: false})
		expect(materialSymbolFor('circle')).toEqual({name: 'radio_button_unchecked', filled: false})
	})

	test('falls back for a name it does not know', () => {
		expect(materialSymbolFor('no.such.symbol')).toEqual({name: FALLBACK_SYMBOL, filled: false})
		expect(materialSymbolFor(undefined)).toEqual({name: FALLBACK_SYMBOL, filled: false})
	})
})
