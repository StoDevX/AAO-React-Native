import deburr from 'lodash/deburr'
import type {BuildingType} from '../types'

/** Buildings grouped under a heading, as `useGroupedBuildings` returns them. */
export type BuildingSection = {title: string; data: BuildingType[]}

/** Lowercases and strips diacritics, so "Rølvaag" is reachable by typing "rolvaag". */
function normalize(text: string): string {
	return deburr(text).toLowerCase()
}

/** The text of a building a reader might plausibly type to find it. */
function searchableText(building: BuildingType): string {
	return [building.name, building.subtitle, building.abbreviation, building.category]
		.filter(Boolean)
		.map((field) => normalize(String(field)))
		.join(' ')
}

/**
 * Narrows grouped buildings to those matching `query`, dropping any section left
 * empty. A blank query returns every section untouched.
 */
export function filterBuildings(sections: BuildingSection[], query: string): BuildingSection[] {
	let needle = normalize(query).trim()
	if (!needle) {
		return sections
	}

	return sections
		.map((section) => ({
			title: section.title,
			data: section.data.filter((building) => searchableText(building).includes(needle)),
		}))
		.filter((section) => section.data.length > 0)
}
