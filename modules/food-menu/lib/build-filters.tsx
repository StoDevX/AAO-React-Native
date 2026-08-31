import type {Moment} from 'moment'
import type {MasterCorIconMapType, MenuItemType, ProcessedMealType} from '../types'
import type {FilterType} from '@frogpond/filter/types'
import {decode, fastGetTrimmedText} from '@frogpond/html-lib'
import * as React from 'react'

import {DietaryBadge} from '../dietary-badge-view'
import {chooseMeal, EMPTY_MEAL} from './choose-meal'
import {dietaryBadge} from './dietary-badge'

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

	// `entries`, not `values`: a category's badge is looked up by the id the cafe
	// keys it under, which the label alone cannot supply.
	const allDietaryRestrictions = Object.entries(corIcons).map(([key, cor]) => ({
		id: key,
		title: decode(cor.label),
		detail: cor.description ? fastGetTrimmedText(cor.description) : '',
	}))

	/**
	 * The same mark the menu rows carry, drawn for a React Native list. Token,
	 * colour, kerning and size all come from `dietaryBadge`, so this and the
	 * rows' SwiftUI badge stay identical.
	 */
	const renderDietaryMark = (option: {id?: string}) =>
		option.id ? <DietaryBadge badge={dietaryBadge(option.id, corIcons)} /> : null

	// Decide which meal will be selected by default
	const mealOptions = meals.map((m) => ({label: m.label}))
	const selectedMeal = (now == null ? meals[0] : chooseMeal(meals, [], now)) ?? EMPTY_MEAL

	// Check if there is at least one special in order to show the specials-only filter
	const stationNames = selectedMeal.stations.map((s) => s.label)
	const shouldShowSpecials =
		foodItems.filter((item) => item.special && stationNames.includes(item.station)).length >= 1

	return [
		{
			type: 'toggle',
			key: 'specials',
			enabled: shouldShowSpecials,
			spec: {
				title: 'Specials Only',
				label: 'Only Show Specials',
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
				// A pull-down regardless of how many stations a cafe serves, so the
				// toolbar's shape doesn't shift with the day's menu.
				presentation: 'menu',
				mode: 'OR',
				selected: [],
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
				renderMark: renderDietaryMark,
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
