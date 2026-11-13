import {describe, expect, test} from '@jest/globals'

import {sentenceCase} from '../ui-case'

describe('sentenceCase', () => {
	test('lowers every word after the first', () => {
		expect(sentenceCase('Report a Problem')).toBe('Report a problem')
		expect(sentenceCase('Course Catalog')).toBe('Course catalog')
		expect(sentenceCase('Try Again')).toBe('Try again')
	})

	test('keeps proper nouns and words with inner capitals', () => {
		expect(sentenceCase('Sign in to St. Olaf')).toBe('Sign in to St. Olaf')
		expect(sentenceCase('Dev BonApp Picker')).toBe('Dev BonApp picker')
		expect(sentenceCase('Call Public Safety')).toBe('Call public safety')
		expect(sentenceCase('FAQ Banners')).toBe('FAQ banners')
		expect(sentenceCase('API Tester')).toBe('API tester')
	})

	test('leaves a single word as it is', () => {
		expect(sentenceCase('Directory')).toBe('Directory')
	})
})
