import {describe, expect, it} from '@jest/globals'
import {statusGlyph} from '../status-glyph'

describe('the glyph a status shows', () => {
	it('fills the circle when open', () => {
		expect(statusGlyph('Open').symbol).toBe('circle.fill')
	})

	it('empties it when closed', () => {
		expect(statusGlyph('Closed').symbol).toBe('circle')
	})

	it('puts a dot inside it when a change is near', () => {
		expect(statusGlyph('Almost Open').symbol).toBe('record.circle')
		expect(statusGlyph('Almost Closed').symbol).toBe('record.circle')
	})

	it('rings a bell for chapel', () => {
		expect(statusGlyph('Chapel').symbol).toBe('bell.circle')
	})
})
