import {describe, expect, it} from '@jest/globals'
import * as c from '@frogpond/colors'
import {getAccentBackgroundColor} from '../color-helpers'

describe('the colour a status shows', () => {
	it('is green when open', () => {
		expect(getAccentBackgroundColor('Open')).toBe(c.systemGreen)
	})

	it('is red when closed', () => {
		expect(getAccentBackgroundColor('Closed')).toBe(c.systemRed)
	})

	it('is orange when a change is near', () => {
		expect(getAccentBackgroundColor('Almost Open')).toBe(c.systemOrange)
		expect(getAccentBackgroundColor('Almost Closed')).toBe(c.systemOrange)
	})

	it('stays yellow for chapel', () => {
		expect(getAccentBackgroundColor('Chapel')).toBe(c.systemYellow)
	})
})
