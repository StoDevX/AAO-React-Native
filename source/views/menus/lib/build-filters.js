// @flow

import type momentT from 'moment'
import type {
	MenuItemType,
	MasterCorIconMapType,
	ProcessedMealType,
} from '../types'
import flatten from 'lodash/flatten'
import filter from 'lodash/filter'
import map from 'lodash/map'
import uniq from 'lodash/uniq'
import type {FilterType} from '../../components/filter'
import {fastGetTrimmedText} from '../../../lib/html'
import {AllHtmlEntities} from 'html-entities'
import {chooseMeal} from './choose-meal'

const entities = new AllHtmlEntities()

export function buildFilters(
	foodItems: MenuItemType[],
	corIcons: MasterCorIconMapType,
	meals: ProcessedMealType[],
	now: momentT,
): FilterType[] {
	// Format the items for the stations filter
	const stations = flatten(meals.map(meal => meal.stations))
	const stationLabels = uniq(stations.map(station => station.label))
	const allStations = stationLabels.map(label => ({title: label}))

	// Grab the labels of the COR icons
	const allDietaryRestrictions = map(corIcons, cor => ({
		title: entities.decode(cor.label),
		image: cor.image ? {uri: cor.image} : null,
		detail: cor.description
			? entities.decode(fastGetTrimmedText(cor.description))
			: '',
	}))

	// Decide which meal will be selected by default
	const mealOptions = meals.map(m => ({label: m.label}))
	const selectedMeal = chooseMeal(meals, [], now)

	// Check if there is at least one special in order to show the specials-only filter
	const stationNames = selectedMeal.stations.map(s => s.label)
	const shouldShowSpecials =
		filter(
			foodItems,
			item => item.special && stationNames.includes(item.station),
		).length >= 1

	return [
		{
			type: 'toggle',
			key: 'specials',
			enabled: shouldShowSpecials,
			spec: {
				label: 'Only Show Specials',
				caption:
					'Allows you to either see only the "specials" for today, or everything the location has to offer (e.g., condiments.)',
			},
			apply: {
				key: 'special',
			},
		},
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
		},
		{
			type: 'list',
			key: 'stations',
			enabled: false,
			spec: {
				title: 'Stations',
				options: allStations,
				mode: 'OR',
				selected: allStations,
			},
			apply: {
				key: 'station',
			},
		},
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
			},
			apply: {
				key: 'cor_icon',
			},
		},
	]
}
