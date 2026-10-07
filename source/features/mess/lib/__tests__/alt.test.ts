import {describe, expect, it} from '@jest/globals'
import {readableAlt, shownCaption} from '../alt'

describe('readableAlt', () => {
	it('keeps alt text that reads as words', () => {
		expect(readableAlt("A Shoe's Journey by Zoe Esterly")).toBe("A Shoe's Journey by Zoe Esterly")
		expect(readableAlt('Photos from the "7 Feet for 7 Shots" march')).toBe(
			'Photos from the "7 Feet for 7 Shots" march',
		)
	})

	it('trims and collapses the whitespace around words', () => {
		expect(readableAlt('  Old   Main \n at dusk ')).toBe('Old Main at dusk')
	})

	it('drops an empty or missing alt', () => {
		expect(readableAlt('')).toBeNull()
		expect(readableAlt('   ')).toBeNull()
		expect(readableAlt(undefined)).toBeNull()
	})

	it('drops a camera or upload file name', () => {
		expect(readableAlt('OliviaAmschler_1')).toBeNull()
		expect(readableAlt('Polish_20200910_145120759')).toBeNull()
		expect(readableAlt('IMG_7781')).toBeNull()
		expect(readableAlt('IMG_7781.jpg')).toBeNull()
		expect(readableAlt('scan 0001.PNG')).toBeNull()
	})

	it('drops a camera or screenshot name with a space in it', () => {
		expect(readableAlt('Screenshot 2024-05-01 at 10.15.32 AM')).toBeNull()
		expect(readableAlt('Screen Shot 2020-09-10 at 2.51.20 PM')).toBeNull()
		expect(readableAlt('IMG 7781')).toBeNull()
		expect(readableAlt('DSC_0001 copy')).toBeNull()
		expect(readableAlt('PXL 20240501 101532')).toBeNull()
	})

	it('keeps words that only begin like a camera name', () => {
		expect(readableAlt('Images of the Hill in fall')).toBe('Images of the Hill in fall')
		expect(readableAlt('A snapshot of campus life')).toBe('A snapshot of campus life')
	})

	it('drops a lone word, which describes nothing', () => {
		expect(readableAlt('Comic')).toBeNull()
	})
})

describe('shownCaption', () => {
	it("shows a picture's caption over its alt text", () => {
		expect(shownCaption({caption: 'Week 3', alt: 'A strip about midterms'})).toBe('Week 3')
	})

	it('falls back to the alt text when there is no caption', () => {
		expect(shownCaption({caption: '', alt: 'A strip about midterms'})).toBe(
			'A strip about midterms',
		)
	})

	it('shows nothing when there is neither', () => {
		expect(shownCaption({caption: ''})).toBe('')
	})
})
