import {describe, expect, test} from '@jest/globals'
import {makeBuilding} from '../../../map/__tests__/fixtures'
import {ownHours} from '../own-hours'
import type {BuildingType} from '../../types'

function venue(name: string, kind: BuildingType['kind'], building?: string): BuildingType {
	return {name, category: 'Academia', kind, building, schedule: []}
}

const tomsonHall = venue('Tomson Hall', 'building', 'toh')
const registrar = venue('Registrar', 'office', 'toh')
const theCage = venue('The Cage', 'space', 'thecage')
const weightRoom = venue('Tom Porter Weight Room', 'space', 'tph')
const pause = [
	venue('The Pause Kitchen', 'space', 'thelionspause'),
	venue("Lion's Pause Pizza Delivery", 'space', 'thelionspause'),
	venue('C-Store', 'space', 'thelionspause'),
]

describe('ownHours', () => {
	test("shows a building's own venue, not the offices inside it", () => {
		expect(ownHours([registrar, tomsonHall], makeBuilding({id: 'toh', name: 'Tomson Hall'}))).toBe(
			tomsonHall,
		)
	})

	test("shows a point's only venue, whatever its kind", () => {
		let point = makeBuilding({id: 'thecage', name: 'The Cage', parent: 'bc'})
		expect(ownHours([theCage, tomsonHall], point)).toBe(theCage)
	})

	// A building's lone space is not the building's hours.
	test('shows nothing for a building whose only venue is a space inside it', () => {
		expect(
			ownHours([weightRoom], makeBuilding({id: 'tph', name: 'Tom Porter Hall'})),
		).toBeUndefined()
	})

	test('shows nothing for a point with several venues', () => {
		let point = makeBuilding({id: 'thelionspause', name: "The Lion's Pause", parent: 'bc'})
		expect(ownHours(pause, point)).toBeUndefined()
	})

	// Carleton venues carry no key, so they never belong to a feature.
	test('never matches a venue without a key', () => {
		let unkeyed = venue('Sayles-Hill', 'building')
		expect(ownHours([unkeyed], makeBuilding({id: 'sayles', name: 'Sayles-Hill'}))).toBeUndefined()
	})

	// validate-building-keys forbids this; if it slipped through, the first wins.
	test('takes the first of two building venues on one key', () => {
		let annex = venue('Tomson Annex', 'building', 'toh')
		expect(ownHours([tomsonHall, annex], makeBuilding({id: 'toh', name: 'Tomson Hall'}))).toBe(
			tomsonHall,
		)
	})
})
