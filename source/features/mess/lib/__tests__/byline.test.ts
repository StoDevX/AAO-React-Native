import {describe, expect, it} from '@jest/globals'
import {bylineDate, bylineText, creditLine, imageLabel, kickerText} from '../byline'

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
	it('says which picture of a set it is, so each reads apart', () => {
		expect(imageLabel({title: 'Spring', bylines: [b('A')]}, {index: 1, count: 3})).toBe(
			'Spring, by A, picture 2 of 3',
		)
	})
	it('says nothing more for a set of one', () => {
		expect(imageLabel({title: 'Spring', bylines: [b('A')]}, {index: 0, count: 1})).toBe(
			'Spring, by A',
		)
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

describe('bylineDate', () => {
	it("spells out the day a story ran, in the reader's zone", () => {
		// 10:24 pm on the 29th in Chicago, already the 30th in UTC.
		expect(bylineDate('2026-04-30T03:24:19.000Z')).toBe('April 29, 2026')
	})
})

describe('creditLine', () => {
	it('names the writers and the date on one line', () => {
		expect(creditLine({bylines: [b('A'), b('B')], published: '2026-04-29T22:24:19.000Z'})).toBe(
			'A and B · April 29, 2026',
		)
	})
	it('gives the date alone when there is no writer', () => {
		expect(creditLine({bylines: [], published: '2026-04-29T22:24:19.000Z'})).toBe('April 29, 2026')
	})
})
