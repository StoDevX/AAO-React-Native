import type {NutritionDetailContainer, NutritionDetailType} from '../types'

/**
 * The nutrients a Nutrition Facts panel lists, in the panel's own order, with
 * the ones it indents beneath a parent marked `nested`.
 *
 * BonApp keys `nutrition_details` alphabetically, which files Serving Size
 * between Saturated Fat and Sodium and puts Dietary Fiber nowhere near the
 * carbohydrate it is part of.
 *
 * Serving size and calories are deliberately absent: the panel sets both apart
 * above the nutrients rather than listing them among them.
 */
const PANEL_ORDER: {key: string; nested: boolean}[] = [
	{key: 'fatContent', nested: false},
	{key: 'saturatedFatContent', nested: true},
	{key: 'transFatContent', nested: true},
	{key: 'cholesterolContent', nested: false},
	{key: 'sodiumContent', nested: false},
	{key: 'carbohydrateContent', nested: false},
	{key: 'fiberContent', nested: true},
	{key: 'sugarContent', nested: true},
	{key: 'proteinContent', nested: false},
]

const SET_APART = ['servingSize', 'calories']

export type NutritionPanelRow = {
	key: string
	detail: NutritionDetailType
	/** Indented beneath the nutrient above it, as Saturated Fat is under Total Fat. */
	nested: boolean
}

export type NutritionPanelType = {
	servingSize?: NutritionDetailType
	calories?: NutritionDetailType
	nutrients: NutritionPanelRow[]
}

/**
 * Arranges an item's nutrition details the way a Nutrition Facts panel does.
 *
 * A nutrient the cafe did not report is left out rather than shown blank, and
 * one this table has never heard of still reaches the reader -- after the
 * nutrients it does know, since it has no place in the panel's order.
 */
export function nutritionPanel(details?: NutritionDetailContainer): NutritionPanelType {
	let byKey = (details ?? {}) as Record<string, NutritionDetailType | undefined>

	let placed = new Set([...SET_APART, ...PANEL_ORDER.map(({key}) => key)])

	let ordered = PANEL_ORDER.flatMap(({key, nested}) => {
		let detail = byKey[key]
		return detail ? [{key, detail, nested}] : []
	})

	let unplaced = Object.entries(byKey).flatMap(([key, detail]) =>
		detail && !placed.has(key) ? [{key, detail, nested: false}] : [],
	)

	return {
		servingSize: byKey.servingSize,
		calories: byKey.calories,
		nutrients: [...ordered, ...unplaced],
	}
}
