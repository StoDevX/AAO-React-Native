import {describe, expect, test} from '@jest/globals'
import {foodRowLabel} from '../food-row-label'
import type {MenuItemType} from '../../types'

const corIcons = {
	vegan: {sort: '1', label: 'Vegan', description: '', image: 'https://x/v.png'},
	halal: {sort: '2', label: 'Halal', description: '', image: 'https://x/h.png'},
}

describe('foodRowLabel', () => {
	let pancakes = {label: 'Pancakes', special: false} as MenuItemType

	test('is just the dish when it carries no icons', () => {
		expect(foodRowLabel(pancakes, corIcons, [])).toBe('Pancakes')
	})

	test('names each dietary icon, since the icons themselves are unlabelled', () => {
		expect(foodRowLabel(pancakes, corIcons, ['vegan', 'halal'])).toBe('Pancakes, Vegan, Halal')
	})

	test('calls out a special', () => {
		let special = {label: 'Pot Roast', special: true} as MenuItemType
		expect(foodRowLabel(special, corIcons, ['vegan'])).toBe('Pot Roast, Special, Vegan')
	})
})
