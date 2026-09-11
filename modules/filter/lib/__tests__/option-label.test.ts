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

	// `label` is optional, and a filter that turns titles off is asking for a
	// name it may not have for every option -- a row drawing nothing at all is
	// worse than one drawing the code.
	test('falls back to the title for an option carrying no label', () => {
		expect(optionLabel({title: 'BIO'}, false)).toBe('BIO')
	})
})
