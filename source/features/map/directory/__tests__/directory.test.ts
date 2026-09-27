import {describe, expect, test} from '@jest/globals'

import type {BuildingType} from '../../../building-hours/types'
import {makeBuilding} from '../../__tests__/fixtures'
import type {PlaceTile} from '../../lib/place-tiles'
import {directoryFor, floorRows, resolveEntry, roomLabel, sortedEntries} from '../directory'
import type {BuildingDirectory} from '../types'

function venue(name: string, building: string): BuildingType {
	return {name, category: 'Offices', kind: 'office', building, schedule: []}
}

function link(label: string, href: string): PlaceTile {
	return {kind: 'department', label, href}
}

const tomson = makeBuilding({id: 'toh', name: 'Tomson Hall'})
const admissionsPoint = makeBuilding({
	id: 'admissionsoffice',
	name: 'Admissions Office',
	parent: 'toh',
})
const elsewhere = makeBuilding({id: 'hh', name: 'Holland Hall'})

const place = {
	building: tomson,
	features: [tomson, admissionsPoint, elsewhere],
	venues: [
		venue('Financial Aid', 'toh'),
		venue('Admissions', 'admissionsoffice'),
		venue('Piper Center', 'toh'),
		venue('Holland Office', 'hh'),
	],
	links: [link('Education', 'https://wp.stolaf.edu/education'), link('Financial Aid', 'https://x')],
}

describe('resolveEntry', () => {
	test('opens a venue named explicitly', () => {
		let target = resolveEntry(
			{name: 'Piper Center for Vocation and Career', venue: 'Piper Center'},
			place,
		)
		expect(target).toEqual({
			kind: 'card',
			opens: {kind: 'venue', name: 'Piper Center'},
			venue: place.venues[2],
		})
	})

	test('opens a point named explicitly', () => {
		expect(resolveEntry({name: 'The front desk', point: 'admissionsoffice'}, place)).toMatchObject({
			kind: 'card',
			opens: {kind: 'feature', id: 'admissionsoffice'},
		})
	})

	test('opens a venue on the building by name, whatever its case', () => {
		expect(resolveEntry({name: 'financial aid'}, place)).toMatchObject({
			kind: 'card',
			opens: {kind: 'venue', name: 'Financial Aid'},
		})
	})

	// The Admissions venue is keyed to the Admissions Office point inside Tomson.
	test('opens a venue on one of its points by name', () => {
		expect(resolveEntry({name: 'Admissions'}, place)).toMatchObject({
			opens: {kind: 'venue', name: 'Admissions'},
		})
	})

	test('opens a point inside the building by name', () => {
		expect(resolveEntry({name: 'Admissions Office'}, place)).toMatchObject({
			opens: {kind: 'feature', id: 'admissionsoffice'},
		})
	})

	test('prefers a venue to a link of the same name', () => {
		expect(resolveEntry({name: 'Financial Aid'}, place).kind).toBe('card')
	})

	test('opens a department link by name', () => {
		expect(resolveEntry({name: 'Education'}, place)).toEqual({
			kind: 'link',
			href: 'https://wp.stolaf.edu/education',
		})
	})

	test('does not reach a venue in another building', () => {
		expect(resolveEntry({name: 'Holland Office'}, place)).toEqual({kind: 'none'})
	})

	// A floor of Tomson listing "Tomson Hall" would otherwise stack the
	// building's own hours over the building's own floor.
	test("does not open the building's own hours", () => {
		let own: BuildingType = {...venue('Tomson Hall', 'toh'), kind: 'building'}
		expect(resolveEntry({name: 'Tomson Hall'}, {...place, venues: [...place.venues, own]})).toEqual(
			{
				kind: 'none',
			},
		)
	})

	test('opens nothing for an unknown name', () => {
		expect(resolveEntry({name: 'Mail Room'}, place)).toEqual({kind: 'none'})
	})

	test('opens nothing for an explicit key that names nothing', () => {
		expect(resolveEntry({name: 'Gone', venue: 'Renamed Office'}, place)).toEqual({kind: 'none'})
		expect(resolveEntry({name: 'Gone', point: 'nowhere'}, place)).toEqual({kind: 'none'})
	})
})

const directory: BuildingDirectory = {
	building: 'toh',
	floors: [
		{name: 'Ground floor', entries: [{name: 'College Events', room: '021'}]},
		{name: 'Mezzanine', entries: []},
		{
			name: '1st floor',
			entries: [
				{name: 'Registrar', room: '140'},
				{name: 'Financial Aid', room: '120'},
			],
		},
	],
}

describe('floorRows', () => {
	test('lists floors bottom to top with how many places each holds', () => {
		expect(floorRows(directory)).toEqual([
			{index: 0, name: 'Ground floor', detail: '1 place'},
			{index: 2, name: '1st floor', detail: '2 places'},
		])
	})

	test('drops a floor with no entries', () => {
		expect(floorRows(directory).map((row) => row.name)).not.toContain('Mezzanine')
	})
})

describe('directoryFor', () => {
	test("finds a building's directory, or none", () => {
		expect(directoryFor([directory], 'toh')).toBe(directory)
		expect(directoryFor([directory], 'hh')).toBeUndefined()
	})
})

describe('roomLabel', () => {
	test('writes the building and room as the college does', () => {
		expect(roomLabel('TOH', '220')).toBe('TOH 220')
		expect(roomLabel('TOH', '290 Balcony')).toBe('TOH 290 Balcony')
	})

	test('gives the room alone when the building has no abbreviation', () => {
		expect(roomLabel(undefined, '220')).toBe('220')
	})

	test('gives nothing with no room', () => {
		expect(roomLabel('TOH', undefined)).toBeUndefined()
	})
})

describe('sortedEntries', () => {
	test("lists a floor's entries alphabetically", () => {
		expect(sortedEntries(directory.floors[2]).map((entry) => entry.name)).toEqual([
			'Financial Aid',
			'Registrar',
		])
	})
})
