import {describe, expect, it} from '@jest/globals'
import {readableAlt} from '../alt'

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

	it('drops a lone word, which describes nothing', () => {
		expect(readableAlt('Comic')).toBeNull()
	})
})
