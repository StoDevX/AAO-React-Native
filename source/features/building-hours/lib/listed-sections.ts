import type {BuildingSection} from './filter-buildings'

/** The heading `useGroupedBuildings` gives the starred venues' section. */
export const FAVORITES_TITLE = 'Favorites'

function isListed(building: BuildingSection['data'][number]): boolean {
	return building.listed !== false
}

/**
 * The Hours list's sections: each category without its unlisted venues,
 * dropping any category left empty. Favorites keeps whatever was starred, and
 * a search sees every venue, so an unlisted one is never out of reach.
 */
export function listedSections(sections: BuildingSection[], query: string): BuildingSection[] {
	if (query.trim()) {
		return sections
	}
	return sections
		.map((section) =>
			section.title === FAVORITES_TITLE
				? section
				: {title: section.title, data: section.data.filter(isListed)},
		)
		.filter((section) => section.data.length > 0)
}

/** Whether any venue is unlisted, and so whether the list needs a way to the rest. */
export function hasUnlisted(sections: BuildingSection[]): boolean {
	return sections.some((section) => section.data.some((building) => !isListed(building)))
}

/** Every category, whole, for the All spaces screen; Favorites repeats them. */
export function withoutFavorites(sections: BuildingSection[]): BuildingSection[] {
	return sections.filter((section) => section.title !== FAVORITES_TITLE)
}
