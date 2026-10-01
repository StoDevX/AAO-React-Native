import {describe, expect, test} from '@jest/globals'
import {grayGradient, resolveGradient} from '@frogpond/colors'

import mapCategoriesData from '../../../../../docs/map-categories.json'
import {
	FALLBACK_GROUP_ICON,
	placeIcon,
	type MapCategoryTable,
	type MapIconEntry,
} from '../category-groups'

/// The list this build ships, as the grid reads it before the first fetch.
const BUNDLED = (mapCategoriesData as unknown as {data: MapCategoryTable}).data

const ICONS: MapIconEntry[] = [
	{categories: ['water'], icon: 'drop.fill', gradient: 'blue'},
	{categories: ['outdoors'], icon: 'tree.fill', gradient: 'green'},
	{categories: ['building'], icon: 'building.2.fill', gradient: 'gray'},
]

describe('placeIcon', () => {
	test("takes the first entry sharing any of the place's categories", () => {
		expect(placeIcon(['outdoors', 'water'], ICONS)).toEqual({
			icon: 'drop.fill',
			gradient: resolveGradient('blue'),
		})
	})

	test('falls back to a gray pin for a place no entry names', () => {
		expect(placeIcon(['point-of-interest'], ICONS)).toEqual({
			icon: FALLBACK_GROUP_ICON,
			gradient: grayGradient,
		})
		expect(placeIcon([], ICONS).icon).toBe(FALLBACK_GROUP_ICON)
		expect(placeIcon(undefined, ICONS).icon).toBe(FALLBACK_GROUP_ICON)
		expect(placeIcon(['water'], []).icon).toBe(FALLBACK_GROUP_ICON)
	})

	test('falls back to the pin for an entry with no icon', () => {
		expect(placeIcon(['water'], [{categories: ['water']}]).icon).toBe(FALLBACK_GROUP_ICON)
	})
})

/// Every combination of categories St. Olaf's feed carried on 2026-09-30, and
/// the icon the bundled list gives it. Pins the list's order: a reorder that
/// turned the ponds into trees, or the fields into buildings, fails here.
const STOLAF_COMBINATIONS: Array<[string[], string]> = [
	[['parking', 'campus-parking'], 'parkingsign'],
	[['parking', 'accessible-parking'], 'figure.roll'],
	[['building', 'administrative', 'academic'], 'graduationcap.fill'],
	[['building', 'residence-hall', 'housing'], 'bed.double.fill'],
	[['outdoors', 'water'], 'water.waves'],
	[['outdoors', 'trail'], 'figure.hiking'],
	[['outdoors', 'trail', 'wellness-walk'], 'figure.walk'],
	[['building', 'administrative'], 'briefcase.fill'],
	[['athletics', 'outdoors'], 'figure.run'],
	[['athletics', 'outdoors', 'field'], 'figure.run'],
	[['point-of-interest', 'dining'], 'fork.knife'],
	[['building', 'athletics'], 'figure.run'],
	[['point-of-interest', 'admissions'], 'briefcase.fill'],
	[['building', 'student-center', 'visitor-center', 'dining'], 'fork.knife'],
	[['point-of-interest', 'ev-charging'], 'info.circle.fill'],
	[['parking', 'admissions-parking'], 'parkingsign'],
	[['parking', 'visitor-parking'], 'parkingsign'],
	[['point-of-interest', 'memorial'], 'building.columns.fill'],
	[['point-of-interest', 'bookstore'], 'info.circle.fill'],
	[['point-of-interest', 'visitor-information'], 'info.circle.fill'],
	[['point-of-interest', 'landmark'], 'building.columns.fill'],
]

/// The same for Carleton's feed on 2026-09-30.
const CARLETON_COMBINATIONS: Array<[string[], string]> = [
	[['building', 'house', 'student-housing'], 'bed.double.fill'],
	[['outdoors'], 'tree.fill'],
	[['building', 'hall', 'student-housing'], 'bed.double.fill'],
	[['building', 'employee-housing', 'house'], 'bed.double.fill'],
	[['academic', 'administrative', 'building', 'hall'], 'graduationcap.fill'],
	[['administrative', 'building', 'house'], 'briefcase.fill'],
	[['academic', 'administrative', 'building'], 'graduationcap.fill'],
	[['building'], 'building.2.fill'],
	[['parking'], 'parkingsign'],
	[['athletics', 'outdoors'], 'figure.run'],
	[['building', 'employee-housing'], 'bed.double.fill'],
	[['administrative', 'building'], 'briefcase.fill'],
	[['athletics', 'building'], 'figure.run'],
	[['building', 'employee-housing', 'house', 'student-housing'], 'bed.double.fill'],
	[['academic', 'building'], 'graduationcap.fill'],
	[['administrative', 'building', 'hall', 'student-housing'], 'bed.double.fill'],
	[['building', 'student-housing'], 'bed.double.fill'],
	[['academic', 'building', 'hall'], 'graduationcap.fill'],
	[['building', 'employee-housing', 'student-housing'], 'bed.double.fill'],
	[['administrative', 'building', 'house', 'student-housing'], 'bed.double.fill'],
	[['administrative', 'athletics', 'building'], 'figure.run'],
	[['administrative', 'building', 'employee-housing', 'house'], 'bed.double.fill'],
]

describe('the bundled icon lists', () => {
	test.each(STOLAF_COMBINATIONS)('St. Olaf: %j draws %s', (categories, icon) => {
		expect(placeIcon(categories, BUNDLED.stolaf.icons).icon).toBe(icon)
	})

	test.each(CARLETON_COMBINATIONS)('Carleton: %j draws %s', (categories, icon) => {
		expect(placeIcon(categories, BUNDLED.carleton.icons).icon).toBe(icon)
	})
})
