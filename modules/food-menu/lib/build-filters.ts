import type {
	FilterType,
	ListType,
	PickerType,
	ToggleType,
} from '@frogpond/filter/types'
import {decode, fastGetTrimmedText} from '@frogpond/html-lib'

import type {
	MasterCorIconMapType,
	MenuItemType,
	ProcessedMealType,
} from '../types'
import {chooseMeal, EMPTY_MEAL} from './choose-meal'
import type {Moment} from 'moment'

export function buildFilters(
	foodItems: MenuItemType[],
	corIcons: MasterCorIconMapType,
	meals: ProcessedMealType[],
	now?: Moment,
): FilterType<MenuItemType>[] {
	// Format the items for the stations filter
	const stations = meals.flatMap((meal) => meal.stations)
	const stationLabels = new Set(stations.map((station) => station.label))
	const allStations = Array.from(stationLabels).map((label) => ({title: label}))

	// Grab the labels of the COR icons
	const allDietaryRestrictions = Object.values(corIcons).map((cor) => ({
		title: decode(cor.label),
		image: cor.image ? {uri: cor.image} : null,
		detail: cor.description ? decode(fastGetTrimmedText(cor.description)) : '',
	}))

	// Decide which meal will be selected by default
	const mealOptions = meals.map((m) => ({label: m.label}))
	const selectedMeal =
		(now == null ? meals[0] : chooseMeal(meals, [], now)) ?? EMPTY_MEAL

	// Check if there is at least one special in order to show the specials-only filter
	const stationNames = selectedMeal.stations.map((s) => s.label)
	const shouldShowSpecials =
		foodItems.filter(
			(item) => item.special && stationNames.includes(item.station),
		).length >= 1

	return [
		{
			type: 'toggle',
			key: 'specials',
			enabled: shouldShowSpecials,
			spec: {
				title: 'Specials Only',
				label: 'Only Show Specials',
				caption:
					'Allows you to either see only the "specials" for today, or everything the location has to offer (e.g., condiments.)',
			},
			apply: {
				key: 'special',
			},
		} as ToggleType<MenuItemType>,
		{
			type: 'picker',
			key: 'meals',
			enabled: true,
			spec: {
				title: "Today's Menus",
				options: mealOptions,
				selected: {label: selectedMeal.label},
			},
			apply: {
				key: 'label',
			},
		} as PickerType<MenuItemType>,
		{
			type: 'list',
			key: 'stations',
			enabled: false,
			spec: {
				title: 'Stations',
				options: allStations,
				mode: 'OR',
				selected: allStations,
				displayTitle: true,
			},
			apply: {
				key: 'station',
			},
		} as ListType<MenuItemType>,
		{
			type: 'list',
			key: 'dietary-restrictions',
			enabled: false,
			spec: {
				title: 'Dietary Restrictions',
				showImages: true,
				options: allDietaryRestrictions,
				mode: 'AND',
				selected: [],
				displayTitle: true,
			},
			apply: {
				key: 'cor_icon',
			},
		} as ListType<MenuItemType>,
	]
}
