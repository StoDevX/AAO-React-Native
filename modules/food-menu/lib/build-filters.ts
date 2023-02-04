import type {
	CorIconType,
	MasterCorIconMapType,
	MenuItemType,
	ProcessedMealType,
} from '../types'
import type {
	Filter,
	ListFilter,
	ListMenuItem,
	ToggleFilter,
} from '@frogpond/filter/types'
import {decode, fastGetTrimmedText} from '@frogpond/html-lib'

function corIconToMenuItem(cor: CorIconType): ListMenuItem {
	let item: ListMenuItem = {
		title: decode(cor.label),
		image: cor.image ? {uri: cor.image} : null,
		subtitle: cor.description
			? decode(fastGetTrimmedText(cor.description))
			: '',
	}

	if (item.subtitle?.startsWith(item.title)) {
		// BonApp shows the things like "Vegan\nVegan: description", duplicating the label...
		item.subtitle = item.subtitle.substring(item.title.length + 2)
	}

	return item
}

export const SPECIALS_FILTER_NAME = 'Specials Only' as const

export function buildFilters(
	foodItems: MenuItemType[],
	corIcons: MasterCorIconMapType,
	meal: ProcessedMealType | undefined,
): Filter<MenuItemType>[] {
	if (!meal) {
		return []
	}

	// Format the items for the stations filter
	const stations = meal.stations
	const stationLabels = new Set(stations.map((station) => station.label))
	const allStations = Array.from(stationLabels).map((label) => ({title: label}))

	// Grab the labels of the COR icons
	const allDietaryRestrictions = Object.values(corIcons).map(corIconToMenuItem)

	// Check if there is at least one special in order to show the specials-only filter
	const stationNames = meal.stations.map((s) => s.label)
	const shouldShowSpecials =
		foodItems.filter(
			(item) => item.special && stationNames.includes(item.station),
		).length >= 1

	const onlySpecialsFilter: ToggleFilter<MenuItemType> = {
		type: 'toggle',
		active: shouldShowSpecials,
		title: SPECIALS_FILTER_NAME,
		field: 'special',
	}

	const stationsFilter: ListFilter<MenuItemType> = {
		type: 'list',
		title: 'Stations',
		options: allStations,
		selectedIndices: [],
		mode: 'any',
		field: 'station',
	}

	const dietFilter: ListFilter<MenuItemType> = {
		type: 'list',
		title: 'Dietary Restrictions',
		options: allDietaryRestrictions,
		selectedIndices: [],
		mode: 'all',
		field: 'dietary',
	}

	return [onlySpecialsFilter, stationsFilter, dietFilter]
}
