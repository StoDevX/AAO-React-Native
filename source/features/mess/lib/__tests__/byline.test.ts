import {describe, expect, it} from '@jest/globals'
import {bylineText, imageLabel, kickerText} from '../byline'

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

describe('imageLabel', () => {
	it('names an image by its title and writers', () => {
		expect(imageLabel({title: 'Spring', bylines: [b('A'), b('B')]})).toBe('Spring, by A and B')
	})
	it('names an image with no writer by its title alone', () => {
		expect(imageLabel({title: 'Spring', bylines: []})).toBe('Spring')
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
