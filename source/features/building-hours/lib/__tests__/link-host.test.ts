import {describe, expect, it} from '@jest/globals'
import {linkHost} from '../link-host'

describe('linkHost', () => {
	it('returns the host of a full URL', () => {
		expect(linkHost('https://www.instagram.com/lionspause/')).toBe('www.instagram.com')
	})

	// A half-typed URL is the normal state of a field someone is still filling
	// in, so it shows itself back rather than an error.
	it('returns the text unchanged when it is not a URL', () => {
		expect(linkHost('instagram.com/lionspause')).toBe('instagram.com/lionspause')
	})

	it('returns nothing for an empty string', () => {
		expect(linkHost('')).toBe('')
	})
})
