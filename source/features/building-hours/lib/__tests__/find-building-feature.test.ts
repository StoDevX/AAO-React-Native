import {describe, expect, test} from '@jest/globals'
import {makeBuilding} from '../../../map/__tests__/fixtures'
import {findBuildingFeature} from '../find-building-feature'
import type {BuildingType} from '../../types'

function makeVenue(overrides: Partial<BuildingType> & {name: string}): BuildingType {
	return {category: 'Academia', schedule: [], ...overrides}
}

describe('findBuildingFeature', () => {
	test('returns the feature whose id matches the venue key', () => {
		let toh = makeBuilding({id: 'toh', name: 'Tomson Hall'})
		let features = [makeBuilding({id: 'thecage', name: 'The Cage'}), toh]
		let venue = makeVenue({name: 'Tomson Hall', building: 'toh'})

		expect(findBuildingFeature(features, venue)).toBe(toh)
	})

	test('returns undefined when the venue carries no key', () => {
		let features = [makeBuilding({id: 'toh', name: 'Tomson Hall'})]
		let venue = makeVenue({name: 'A Carleton Venue'})

		expect(findBuildingFeature(features, venue)).toBeUndefined()
	})

	test('returns undefined when the key matches no feature, without throwing', () => {
		let features = [makeBuilding({id: 'toh', name: 'Tomson Hall'})]
		let venue = makeVenue({name: 'Not Yet Mapped', building: 'nonexistent-id'})

		expect(() => findBuildingFeature(features, venue)).not.toThrow()
		expect(findBuildingFeature(features, venue)).toBeUndefined()
	})

	test('resolves several venues sharing one building to that one feature', () => {
		let toh = makeBuilding({id: 'toh', name: 'Tomson Hall'})
		let features = [toh]
		let registrar = makeVenue({name: 'Registrar', building: 'toh'})
		let financialAid = makeVenue({name: 'Financial Aid', building: 'toh'})
		let healthServices = makeVenue({name: 'Health Services', building: 'toh'})

		expect(findBuildingFeature(features, registrar)).toBe(toh)
		expect(findBuildingFeature(features, financialAid)).toBe(toh)
		expect(findBuildingFeature(features, healthServices)).toBe(toh)
	})
})
