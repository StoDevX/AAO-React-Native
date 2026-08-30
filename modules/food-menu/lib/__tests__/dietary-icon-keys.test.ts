import {describe, expect, test} from '@jest/globals'
import {dietaryIconKeys} from '../dietary-icon-keys'

const corIcons = {
	vegan: {sort: '1', label: 'Vegan', description: '', image: 'https://x/v.png'},
	halal: {sort: '2', label: 'Halal', description: '', image: 'https://x/h.png'},
}

describe('dietaryIconKeys', () => {
	test('returns only the cafe icons the item carries', () => {
		expect(dietaryIconKeys(corIcons, {vegan: ''})).toEqual(['vegan'])
	})

	test('ignores an item tag the cafe does not define', () => {
		expect(dietaryIconKeys(corIcons, {kosher: ''})).toEqual([])
	})

	test('returns an empty list for an item with no tags', () => {
		expect(dietaryIconKeys(corIcons, {})).toEqual([])
	})

	test('preserves the cafe icon order, not the item tag order', () => {
		expect(dietaryIconKeys(corIcons, {halal: '', vegan: ''})).toEqual(['vegan', 'halal'])
	})
})
