import {describe, expect, test} from '@jest/globals'

import {nutritionPanel} from '../nutrition-panel'
import type {NutritionDetailContainer, NutritionDetailType} from '../../types'

function detail(label: string, value: number, unit: string): NutritionDetailType {
	return {label, value, unit}
}

/**
 * Keyed and ordered as BonApp actually hands it back: alphabetically, which is
 * why the panel has to reorder it at all.
 */
function stavDetails(): NutritionDetailContainer {
	return {
		calories: detail('Calories', 50, ''),
		carbohydrateContent: detail('Total Carbohydrate', 9, 'g'),
		cholesterolContent: detail('Cholesterol', 0, 'mg'),
		fatContent: detail('Total Fat', 1, 'g'),
		fiberContent: detail('Dietary Fiber', 1, 'g'),
		proteinContent: detail('Protein', 2, 'g'),
		saturatedFatContent: detail('Saturated Fat', 0, 'g'),
		servingSize: detail('Serving Size', 4, 'oz'),
		sodiumContent: detail('Sodium', 0, 'mg'),
		sugarContent: detail('Sugars', 0, 'g'),
		transFatContent: detail('Trans Fat', 0, 'g'),
	}
}

describe('nutritionPanel', () => {
	// The order is the whole point: alphabetically, Dietary Fiber lands between
	// Cholesterol and Protein rather than under the carbohydrate it is part of.
	test('puts the nutrients in the order a Nutrition Facts panel uses', () => {
		let {nutrients} = nutritionPanel(stavDetails())

		expect(nutrients.map(({detail: d}) => d.label)).toEqual([
			'Total Fat',
			'Saturated Fat',
			'Trans Fat',
			'Cholesterol',
			'Sodium',
			'Total Carbohydrate',
			'Dietary Fiber',
			'Sugars',
			'Protein',
		])
	})

	test('indents the nutrients the panel nests beneath a parent', () => {
		let {nutrients} = nutritionPanel(stavDetails())
		let nested = nutrients.filter((row) => row.nested).map(({detail: d}) => d.label)

		expect(nested).toEqual(['Saturated Fat', 'Trans Fat', 'Dietary Fiber', 'Sugars'])
	})

	// Serving size and calories head the panel rather than sitting among the
	// nutrients, so they must not also appear in the list.
	test('sets serving size and calories apart from the nutrients', () => {
		let panel = nutritionPanel(stavDetails())

		expect(panel.servingSize?.label).toBe('Serving Size')
		expect(panel.calories?.label).toBe('Calories')
		expect(panel.nutrients.map(({key}) => key)).not.toContain('servingSize')
		expect(panel.nutrients.map(({key}) => key)).not.toContain('calories')
	})

	test('leaves out a nutrient the cafe did not report', () => {
		let details = {
			fatContent: detail('Total Fat', 1, 'g'),
			proteinContent: detail('Protein', 2, 'g'),
		} as NutritionDetailContainer

		let {nutrients} = nutritionPanel(details)

		expect(nutrients.map(({detail: d}) => d.label)).toEqual(['Total Fat', 'Protein'])
	})

	// A nutrient BonApp adds later has no place in the panel's order, but
	// dropping it silently would lose data the reader came for.
	test('keeps a nutrient it has no place for, after the ones it knows', () => {
		let details = {
			addedSugarContent: detail('Added Sugars', 10, 'g'),
			fatContent: detail('Total Fat', 1, 'g'),
		} as unknown as NutritionDetailContainer

		let {nutrients} = nutritionPanel(details)

		expect(nutrients.map(({detail: d}) => d.label)).toEqual(['Total Fat', 'Added Sugars'])
	})

	test('reports an empty panel when the item has no details at all', () => {
		let panel = nutritionPanel(undefined)

		expect(panel).toEqual({servingSize: undefined, calories: undefined, nutrients: []})
	})
})
