import {describe, expect, test} from '@jest/globals'

import type {NutritionDetailType} from '../../types'
import {calculateAmount} from '../calculate-amount'

function detail(value: number, unit: string): NutritionDetailType {
	return {label: 'Total Fat', value, unit} as NutritionDetailType
}

describe('calculateAmount', () => {
	test('sets the figure against its unit, the way a panel prints one', () => {
		expect(calculateAmount(detail(12, 'g'))).toBe('12g')
	})

	test('states a serving size the same way', () => {
		expect(calculateAmount(detail(4, 'oz'))).toBe('4oz')
	})

	// Calories arrive with no unit at all.
	test('prints a figure that carries no unit on its own', () => {
		expect(calculateAmount(detail(50, ''))).toBe('50')
	})

	// BonApp reports a trace amount as the unit "lessthang" rather than as a
	// value, so the words have to be recovered from it.
	test('spells out a trace amount BonApp folded into the unit', () => {
		expect(calculateAmount(detail(1, 'lessthang'))).toBe('less than 1g')
		expect(calculateAmount(detail(5, 'lessthanmg'))).toBe('less than 5mg')
	})
})
