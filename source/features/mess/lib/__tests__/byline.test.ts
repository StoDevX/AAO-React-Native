import {describe, expect, it} from '@jest/globals'
import {bylineText, kickerText} from '../byline'

const b = (name: string) => ({id: 1, name})

describe('bylineText', () => {
	it('names one writer', () => {
		expect(bylineText([b('Maya Betti')])).toBe('By Maya Betti')
	})
	it('joins two with and', () => {
		expect(bylineText([b('A'), b('B')])).toBe('By A and B')
	})
	it('joins three with commas and a final and', () => {
		expect(bylineText([b('A'), b('B'), b('C')])).toBe('By A, B and C')
	})
	it('gives nothing when there is no byline', () => {
		expect(bylineText([])).toBeNull()
	})
})

describe('kickerText', () => {
	it('shows the section', () => {
		expect(kickerText({section: 'News', column: null})).toBe('News')
	})
	it('shortens Arts & Entertainment and adds the column', () => {
		expect(kickerText({section: 'Arts & Entertainment', column: 'StoReview'})).toBe(
			'A&E · StoReview',
		)
	})
	it('gives nothing without a section', () => {
		expect(kickerText({section: null, column: null})).toBeNull()
	})
})
