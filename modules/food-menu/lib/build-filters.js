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
import type {FilterType} from '@frogpond/filter'
import {fastGetTrimmedText, entities} from '@frogpond/html-lib'
import {chooseMeal} from './choose-meal'

export function buildFilters(
	foodItems: MenuItemType[],
	corIcons: MasterCorIconMapType,
	meals: ProcessedMealType[],
	now: momentT,
): FilterType[] {
	// Format the items for the stations filter
	let stations = flatten(meals.map(meal => meal.stations))
	let stationLabels = uniq(stations.map(station => station.label))
	let allStations = stationLabels.map(label => ({title: label}))

	// Grab the labels of the COR icons
	let allDietaryRestrictions = map(corIcons, cor => ({
		title: entities.decode(cor.label),
		image: cor.image ? {uri: cor.image} : null,
		detail: cor.description
			? entities.decode(fastGetTrimmedText(cor.description))
			: '',
	}))

	// Decide which meal will be selected by default
	let mealOptions = meals.map(m => ({label: m.label}))
	let selectedMeal = chooseMeal(meals, [], now)

	// Check if there is at least one special in order to show the specials-only filter
	let stationNames = selectedMeal.stations.map(s => s.label)
	let shouldShowSpecials =
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
				title: 'Specials Only',
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
				displayTitle: true,
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
				displayTitle: true,
			},
			apply: {
				key: 'cor_icon',
			},
		},
	]
}
