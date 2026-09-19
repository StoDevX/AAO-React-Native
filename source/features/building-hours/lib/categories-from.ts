import type {BuildingType} from '../types'

/**
 * Every category the venues in `buildings` use, once each, in alphabetical
 * order. The report form's category picker offers these rather than free text:
 * a category is a section header on the campus list, so one typo invents a
 * section.
 */
export function categoriesFrom(buildings: BuildingType[]): string[] {
	return [...new Set(buildings.map((building) => building.category))].sort((a, b) =>
		a.localeCompare(b),
	)
}
