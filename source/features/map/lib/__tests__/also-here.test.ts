import {describe, expect, test} from '@jest/globals'

import {alsoHere} from '../also-here'
import {makeBuilding} from '../../__tests__/fixtures'
import type {BuildingType} from '../../../building-hours/types'

function venue(name: string, kind: BuildingType['kind'], building?: string): BuildingType {
	return {name, category: 'Academia', kind, building, schedule: []}
}

const buntrock = makeBuilding({id: 'bc', name: 'Buntrock Commons'})
const theCage = makeBuilding({id: 'thecage', name: 'The Cage', parent: 'bc'})
const stav = makeBuilding({id: 'stavhall', name: 'Stav Hall', parent: 'bc'})
const pause = makeBuilding({id: 'thelionspause', name: "The Lion's Pause", parent: 'bc'})
const tomson = makeBuilding({id: 'toh', name: 'Tomson Hall'})

describe('alsoHere', () => {
	test("lists a building's points and venues alphabetically, without its own venue", () => {
		let cageVenue = venue('The Cage', 'space', 'thecage')
		let osa = venue('OSA', 'office', 'bc')
		let postOffice = venue('Post Office', 'office', 'bc')
		let venues = [venue('Buntrock Commons', 'building', 'bc'), osa, postOffice, cageVenue]

		expect(alsoHere(buntrock, [buntrock, theCage, stav, tomson], venues)).toEqual([
			{opens: {kind: 'venue', name: 'OSA'}, label: 'OSA', group: 'office', venue: osa},
			{
				opens: {kind: 'venue', name: 'Post Office'},
				label: 'Post Office',
				group: 'office',
				venue: postOffice,
			},
			{
				opens: {kind: 'feature', id: 'stavhall'},
				label: 'Stav Hall',
				group: 'place',
				venue: undefined,
			},
			// The Cage's venue is keyed to the point, so it comes through the point's tile.
			{
				opens: {kind: 'feature', id: 'thecage'},
				label: 'The Cage',
				group: 'place',
				venue: cageVenue,
			},
		])
	})

	test("lists a point's own venues when it has several", () => {
		let venues = [
			venue('The Pause Kitchen', 'space', 'thelionspause'),
			venue('C-Store', 'space', 'thelionspause'),
			venue("Lion's Pause Pizza Delivery", 'space', 'thelionspause'),
		]

		expect(
			alsoHere(pause, [buntrock, pause], venues).map((tile) => [tile.label, tile.opens]),
		).toEqual([
			['C-Store', {kind: 'venue', name: 'C-Store'}],
			["Lion's Pause Pizza Delivery", {kind: 'venue', name: "Lion's Pause Pizza Delivery"}],
			['The Pause Kitchen', {kind: 'venue', name: 'The Pause Kitchen'}],
		])
	})

	test("lists a building's offices", () => {
		let venues = [
			venue('Tomson Hall', 'building', 'toh'),
			venue('Registrar', 'office', 'toh'),
			venue('Financial Aid', 'office', 'toh'),
		]

		expect(alsoHere(tomson, [tomson], venues).map((tile) => [tile.label, tile.group])).toEqual([
			['Financial Aid', 'office'],
			['Registrar', 'office'],
		])
	})

	test('sorts regardless of case and accents', () => {
		let venues = [venue('Zeta', 'space', 'toh'), venue('Écho', 'space', 'toh')]

		expect(alsoHere(tomson, [tomson], venues).map((tile) => tile.label)).toEqual(['Écho', 'Zeta'])
	})

	// Carleton's feed has no parents and its venues no building keys.
	test('is empty for a place nothing is keyed to', () => {
		let sayles = makeBuilding({id: 'sayles', name: 'Sayles-Hill'})

		expect(alsoHere(sayles, [sayles], [venue('Sayles Café', undefined)])).toEqual([])
	})

	// A lot's accessible spot, or one beside a building, is its own group: the
	// card gives it a section of its own rather than Also at This Location.
	test('marks an accessible spot as accessible parking', () => {
		let porter = makeBuilding({id: 'lot-porter', name: 'Porter', categories: ['parking']})
		let spot = makeBuilding({
			id: 'accessibleparking-20',
			name: 'Accessible Parking, Porter',
			categories: ['parking', 'accessible-parking'],
			parent: 'lot-porter',
		})
		expect(alsoHere(porter, [porter, spot], [])).toEqual([
			{
				opens: {kind: 'feature', id: 'accessibleparking-20'},
				label: 'Accessible Parking, Porter',
				group: 'accessible-parking',
				venue: undefined,
			},
		])
	})
})
