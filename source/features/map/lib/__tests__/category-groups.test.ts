import {describe, expect, test} from '@jest/globals'
import {goldGradient, grayGradient} from '@frogpond/colors'

import {makeBuilding} from '../../__tests__/fixtures'
import {
	FALLBACK_GROUP_ICON,
	groupColor,
	groupsFor,
	placesIn,
	type MapCategoryTable,
} from '../category-groups'

const TABLE: MapCategoryTable = {
	'edu.stolaf': {
		groups: [
			{label: 'All Buildings', categories: ['building'], icon: 'building.2.fill', gradient: 'gray'},
			{label: 'Academic', categories: ['academic'], icon: 'graduationcap.fill', gradient: 'gold'},
			{
				label: 'Housing',
				categories: ['residence-hall', 'housing'],
				icon: 'bed.double.fill',
				gradient: 'indigo',
			},
			{label: 'Outdoors', categories: ['outdoors'], icon: 'tree.fill', gradient: 'green'},
		],
		icons: [],
	},
	'edu.carleton': {
		groups: [{label: 'Outdoors', categories: ['outdoors'], icon: 'tree.fill', gradient: 'green'}],
		icons: [],
	},
}

const PLACES = [
	makeBuilding({
		id: 'ytt',
		name: 'Ytterboe Hall',
		categories: ['building', 'residence-hall', 'housing'],
	}),
	makeBuilding({id: 'rns', name: 'Regents Hall', categories: ['building', 'academic']}),
	makeBuilding({id: 'hoy', name: 'Hoyme Hall', categories: ['building', 'residence-hall']}),
]

const labels = (table: MapCategoryTable, places = PLACES) =>
	groupsFor(table, 'edu.stolaf', places).map((group) => group.label)

describe('groupsFor', () => {
	test('keeps the order the file gives', () => {
		expect(labels(TABLE)).toEqual(['All Buildings', 'Academic', 'Housing'])
	})

	// An entry can wait for places its campus's feed does not carry.
	test('hides a group with no places', () => {
		expect(labels(TABLE)).not.toContain('Outdoors')
	})

	test('shows a waiting group once a place carries its value', () => {
		let withPond = [
			...PLACES,
			makeBuilding({id: 'pond', name: 'Big Pond', categories: ['outdoors']}),
		]
		expect(labels(TABLE, withPond)).toContain('Outdoors')
	})

	test('reads the campus it is asked for', () => {
		let campusPlaces = [makeBuilding({id: 'arb', name: 'The Arb', categories: ['outdoors']})]
		expect(groupsFor(TABLE, 'edu.carleton', campusPlaces).map((group) => group.label)).toEqual([
			'Outdoors',
		])
	})

	test('resolves the icon and gradient', () => {
		let [first, second] = groupsFor(TABLE, 'edu.stolaf', PLACES)
		expect(first).toMatchObject({icon: 'building.2.fill', gradient: grayGradient})
		expect(second).toMatchObject({icon: 'graduationcap.fill', gradient: goldGradient})
	})

	// A released app can meet a file written for a newer one.
	test('falls back when an entry has no icon or gradient', () => {
		let bare: MapCategoryTable = {
			'edu.stolaf': {groups: [{label: 'All Buildings', categories: ['building']}], icons: []},
			'edu.carleton': {groups: [], icons: []},
		}
		expect(groupsFor(bare, 'edu.stolaf', PLACES)[0]).toMatchObject({
			icon: FALLBACK_GROUP_ICON,
			gradient: grayGradient,
		})
	})

	// A label is how a group is keyed and found again; two entries sharing one
	// would collide, so the first is kept.
	test('keeps only the first of two entries with the same label', () => {
		let doubled: MapCategoryTable = {
			'edu.stolaf': {
				groups: [
					{
						label: 'Housing',
						categories: ['residence-hall'],
						icon: 'bed.double.fill',
						gradient: 'indigo',
					},
					{label: 'Housing', categories: ['building'], icon: 'house.fill', gradient: 'gold'},
				],
				icons: [],
			},
			'edu.carleton': {groups: [], icons: []},
		}
		let groups = groupsFor(doubled, 'edu.stolaf', PLACES)
		expect(groups.map((group) => [group.label, group.icon])).toEqual([
			['Housing', 'bed.double.fill'],
		])
	})

	test('has no groups before any place has loaded', () => {
		expect(groupsFor(TABLE, 'edu.stolaf', [])).toEqual([])
	})
})

describe('placesIn', () => {
	let housing = () => {
		let group = groupsFor(TABLE, 'edu.stolaf', PLACES).find(
			(candidate) => candidate.label === 'Housing',
		)
		if (!group) {
			throw new Error('the fixtures should have a Housing group')
		}
		return group
	}

	test('lists every place carrying any of its values, by name', () => {
		expect(placesIn(housing(), PLACES).map((place) => place.properties.name)).toEqual([
			'Hoyme Hall',
			'Ytterboe Hall',
		])
	})

	test("lists a place once even when it matches two of the group's values", () => {
		let ids = placesIn(housing(), PLACES).map((place) => place.id)
		expect(ids.filter((id) => id === 'ytt')).toHaveLength(1)
	})

	test('lists a place in each group it belongs to', () => {
		let groups = groupsFor(TABLE, 'edu.stolaf', PLACES)
		let holding = groups.filter((group) =>
			placesIn(group, PLACES).some((place) => place.id === 'ytt'),
		)
		expect(holding.map((group) => group.label)).toEqual(['All Buildings', 'Housing'])
	})

	// A record can carry no categories at all.
	test('leaves out a place that lists no categories', () => {
		let bare = [makeBuilding({id: 'windmill', name: 'Windmill', categories: []})]
		expect(placesIn(housing(), bare)).toEqual([])
	})
})

describe('groupColor', () => {
	// SwiftUI images and MapLibre paint both take an rgb() string; neither
	// takes the display-p3 notation the gradients are written in.
	test("reads the gradient's darker stop as an rgb color", () => {
		// goldGradient[1] is color(display-p3 0.9216 0.651 0.3529)
		expect(groupColor(goldGradient)).toBe('rgb(235, 166, 90)')
	})
})
