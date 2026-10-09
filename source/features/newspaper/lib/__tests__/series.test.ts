import {describe, expect, it} from '@jest/globals'
import {seriesKey, seriesName} from '../series'

describe('seriesName', () => {
	it.each([
		['Mouse Friends: sunsets of life', 'Mouse Friends'],
		['Mouse Friends episode 5: why does the cow jump over the moon?', 'Mouse Friends'],
		['Mouse friends episode 2: Mary! Gold!', 'Mouse friends'],
		['Mouse Friends Episode One: “I’m Lucky to Bicker With You”', 'Mouse Friends'],
		['Coloring Page: flying into summer', 'Coloring Page'],
	])('reads %s as %s', (title, name) => {
		expect(seriesName(title)).toBe(name)
	})

	it('gives nothing for a title without a colon', () => {
		expect(seriesName('A sunny thanks')).toBeNull()
	})

	it('gives nothing for a title that opens with a colon', () => {
		expect(seriesName(': a sunny thanks')).toBeNull()
	})

	it('gives nothing when the text before the colon has no letter, as in a time', () => {
		expect(seriesName('2:46am on a Monday Morning')).toBeNull()
	})
})

describe('seriesKey', () => {
	it.each([
		['Mouse Friends: sunsets of life', 'mouse friends'],
		['Mouse Friends episode 5: why does the cow jump over the moon?', 'mouse friends'],
		['Mouse friends episode 2: Mary! Gold!', 'mouse friends'],
		['Mouse Friends Episode One: “I’m Lucky to Bicker With You”', 'mouse friends'],
		['Coloring Page: flying into summer', 'coloring page'],
		['Microfiction Corner: The Dummy', 'microfiction corner'],
		['Microfiction corner: Quarters for Flowers', 'microfiction corner'],
		['The Aeneid Reboot: Chapter 1', 'the aeneid reboot'],
	])('reads %s as %s', (title, key) => {
		expect(seriesKey(title)).toBe(key)
	})

	it('gives nothing for a title without a colon', () => {
		expect(seriesKey('A sunny thanks')).toBeNull()
	})

	it('gives nothing when the text before the colon has no letter, as in a time', () => {
		expect(seriesKey('2:46am on a Monday Morning')).toBeNull()
	})
})
