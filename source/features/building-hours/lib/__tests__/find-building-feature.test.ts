import {describe, expect, test} from '@jest/globals'
import {makeBuilding} from '../../../map/__tests__/fixtures'
import {findBuildingFeature, resolveCutoutFeature} from '../find-building-feature'
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

/** A feature with an outline, which is what a cutout needs to frame. */
function makeFootprint(id: string, parent?: string) {
	let feature = makeBuilding(parent === undefined ? {id} : {id, parent})
	feature.geometry.geometries.push({
		type: 'Polygon',
		coordinates: [
			[
				[-93.18, 44.46],
				[-93.17, 44.46],
				[-93.17, 44.47],
				[-93.18, 44.47],
				[-93.18, 44.46],
			],
		],
	})
	return feature
}

describe('resolveCutoutFeature', () => {
	test("frames the venue's own feature when it has a footprint", () => {
		let toh = makeFootprint('toh')
		let venue = makeVenue({name: 'Registrar', building: 'toh'})

		expect(resolveCutoutFeature([toh], venue)).toBe(toh)
	})

	test('frames the parent when the venue sits on a point', () => {
		let bc = makeFootprint('bc')
		let cage = makeBuilding({id: 'thecage', parent: 'bc'})
		let venue = makeVenue({name: 'The Cage', building: 'thecage'})

		expect(resolveCutoutFeature([cage, bc], venue)).toBe(bc)
	})

	test('walks more than one link to reach a footprint', () => {
		let bc = makeFootprint('bc')
		let desk = makeBuilding({id: 'desk', parent: 'kiosk'})
		let kiosk = makeBuilding({id: 'kiosk', parent: 'bc'})
		let venue = makeVenue({name: 'A Desk', building: 'desk'})

		expect(resolveCutoutFeature([desk, kiosk, bc], venue)).toBe(bc)
	})

	test('gives up when nothing in the chain has a footprint', () => {
		let windmill = makeBuilding({id: 'windmill'})
		let venue = makeVenue({name: 'Windmill', building: 'windmill'})

		expect(resolveCutoutFeature([windmill], venue)).toBeUndefined()
	})

	test('gives up when a parent names a feature that is not in the feed', () => {
		let orphan = makeBuilding({id: 'orphan', parent: 'nosuchbuilding'})
		let venue = makeVenue({name: 'Orphan', building: 'orphan'})

		expect(resolveCutoutFeature([orphan], venue)).toBeUndefined()
	})

	// A cycle cannot be reached through the published data -- verify.py in
	// campus-map-data rejects a parent that names its own place -- but the app
	// reads whatever the server sends, and a loop here would hang the render.
	test('stops rather than looping when parents form a cycle', () => {
		let a = makeBuilding({id: 'a', parent: 'b'})
		let b = makeBuilding({id: 'b', parent: 'a'})
		let venue = makeVenue({name: 'A', building: 'a'})

		expect(resolveCutoutFeature([a, b], venue)).toBeUndefined()
	})

	test('returns undefined for a venue with no key at all', () => {
		let bc = makeFootprint('bc')
		let venue = makeVenue({name: 'A Carleton Venue'})

		expect(resolveCutoutFeature([bc], venue)).toBeUndefined()
	})
})
