import {describe, expect, test} from '@jest/globals'

import {optionLabel} from '../option-label'

describe('optionLabel', () => {
	// Stations, Dietary Restrictions and the rest: the title is the name the
	// cafe publishes, and it is what the reader should see.
	test('draws the title when the filter displays titles', () => {
		expect(optionLabel({title: 'BIO', label: 'Biology'}, true)).toBe('BIO')
	})

	// The course catalog's departments arrive as codes with a spelt-out label
	// beside them -- `BIO` is no use to a reader looking for Biology.
	test('draws the label instead when it does not', () => {
		expect(optionLabel({title: 'BIO', label: 'Biology'}, false)).toBe('Biology')
	})
})
