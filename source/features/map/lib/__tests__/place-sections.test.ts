import {describe, expect, test} from '@jest/globals'

import {nameKey, placeSections} from '../place-sections'
import type {PlaceTile} from '../place-tiles'
import type {BuildingType} from '../../../building-hours/types'

function venue(name: string, kind: BuildingType['kind']): BuildingType {
	return {name, category: 'Offices', kind, schedule: []}
}

function link(kind: 'department' | 'office', label: string): PlaceTile {
	return {kind, label, href: `https://example.com/${label}`}
}

function candidate(kind: 'office' | 'place', label: string, v?: BuildingType): PlaceTile {
	return {kind, label, href: null, opens: {kind: 'venue', name: label}, venue: v}
}

describe('placeSections', () => {
	test("merges a department link with an office of the same name, as St. Olaf's feed files them", () => {
		let registrar = venue('Registrar', 'office')
		let writingDesk = venue('Writing Desk', 'office')
		let sections = placeSections(
			[link('department', 'Registrar'), link('department', 'Biology')],
			[
				candidate('office', 'Registrar', registrar),
				candidate('office', 'Writing Desk', writingDesk),
			],
		)

		expect(sections.departments).toEqual([
			{kind: 'department', label: 'Biology', href: 'https://example.com/Biology'},
			{
				kind: 'department',
				label: 'Registrar',
				href: 'https://example.com/Registrar',
				opens: {
					kind: 'venue',
					name: 'Registrar',
					link: {label: 'Registrar', href: 'https://example.com/Registrar'},
				},
				venue: registrar,
			},
		])
		expect(sections.offices).toEqual([candidate('office', 'Writing Desk', writingDesk)])
		expect(sections.alsoHere).toEqual([])
	})

	test('puts unlinked offices under Offices and leaves the rest as also here', () => {
		let postOffice = venue('Post Office', 'office')
		let osa = venue('OSA', 'office')
		let theCage: PlaceTile = {
			kind: 'place',
			label: 'The Cage',
			href: null,
			opens: {kind: 'feature', id: 'thecage'},
		}
		let sections = placeSections(
			[link('office', 'Post Office')],
			[candidate('office', 'Post Office', postOffice), candidate('office', 'OSA', osa), theCage],
		)

		expect(sections.offices.map((tile) => [tile.label, Boolean(tile.opens), tile.href])).toEqual([
			['OSA', true, null],
			['Post Office', true, 'https://example.com/Post Office'],
		])
		expect(sections.alsoHere).toEqual([theCage])
	})

	// A point opens its own card; the link's page must reach it too.
	test("carries a link's page to a point it merges with", () => {
		let theCage: PlaceTile = {
			kind: 'place',
			label: 'The Cage',
			href: null,
			opens: {kind: 'feature', id: 'thecage'},
		}
		let sections = placeSections([link('department', 'The Cage')], [theCage])

		expect(sections.departments[0].opens).toEqual({
			kind: 'feature',
			id: 'thecage',
			link: {label: 'The Cage', href: 'https://example.com/The Cage'},
		})
	})

	test('merges a place with at most one link', () => {
		let sections = placeSections(
			[link('department', 'Registrar'), link('department', 'Registrar')],
			[candidate('office', 'Registrar', venue('Registrar', 'office'))],
		)

		expect(sections.departments.filter((tile) => tile.opens)).toHaveLength(1)
		expect(sections.departments).toHaveLength(2)
	})
})

describe('placeSections, accessible parking', () => {
	test('gives accessible spots a section of their own', () => {
		let spot: PlaceTile = {
			kind: 'accessible-parking',
			label: 'Accessible Parking, New Hall',
			href: null,
			opens: {kind: 'feature', id: 'accessibleparking-4'},
		}
		let cage = candidate('place', 'The Cage')
		let sections = placeSections([], [spot, cage])
		expect(sections.accessibleParking).toEqual([spot])
		expect(sections.alsoHere).toEqual([cage])
	})
})

describe('nameKey', () => {
	test('folds case, accents and punctuation', () => {
		expect(nameKey('Piper Center')).toBe(nameKey('piper center'))
		expect(nameKey('Café')).toBe(nameKey('cafe'))
		expect(nameKey("St. Olaf's")).toBe(nameKey('st olafs'))
	})

	test('matches nothing looser than that', () => {
		expect(nameKey('Office of the Registrar')).not.toBe(nameKey('Registrar'))
	})
})
