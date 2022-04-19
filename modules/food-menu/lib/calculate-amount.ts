import type {NutritionDetailType} from '../types'

export function calculateAmount(nutrition: NutritionDetailType): string {
	// turn "lessthang" and "lessthanmg" into "less than 1g", "less than 5mg", etc
	return nutrition.unit.includes('lessthan')
		? `less than ${nutrition.value}${nutrition.unit.split('lessthan')[1]}`
		: `${nutrition.value}${nutrition.unit}`
}
