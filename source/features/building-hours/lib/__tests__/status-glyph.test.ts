import {describe, expect, it} from '@jest/globals'
import {statusGlyph} from '../status-glyph'

describe('the glyph a status shows', () => {
	it('fills the circle when open', () => {
		expect(statusGlyph('Open').symbol).toBe('circle.fill')
	})

	it('empties it when closed', () => {
		expect(statusGlyph('Closed').symbol).toBe('circle')
	})

	it('fills half of it when a change is near', () => {
		expect(statusGlyph('Almost Open').symbol).toBe('circle.lefthalf.filled')
		expect(statusGlyph('Almost Closed').symbol).toBe('circle.righthalf.filled')
	})

	it('rings a bell for chapel', () => {
		expect(statusGlyph('Chapel').symbol).toBe('bell.circle')
	})

	it('takes the service symbol from the data', () => {
		expect(statusGlyph('Service', {symbol: 'phone.circle', name: 'Phone'}).symbol).toBe(
			'phone.circle',
		)
	})

	it('falls back to a filled circle when a service named no symbol', () => {
		expect(statusGlyph('Service', {name: 'Phone'}).symbol).toBe('circle.fill')
	})

	it('falls back to a filled circle when there is no service at all', () => {
		expect(statusGlyph('Service').symbol).toBe('circle.fill')
	})
})
