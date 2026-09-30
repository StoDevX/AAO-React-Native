import {describe, expect, test} from '@jest/globals'

import {makeBuilding} from '../../__tests__/fixtures'
import type {Building, Feature} from '../../types'
import {framingFor, pinBounds, pinCollection, pinIds, pressedPin} from '../map-pins'

function at(id: string, lng: number, lat: number): Feature<Building> {
	let place = makeBuilding({id, name: id})
	return {
		...place,
		geometry: {type: 'GeometryCollection', geometries: [{type: 'Point', coordinates: [lng, lat]}]},
	}
}

const unpinned = makeBuilding({id: 'nowhere', name: 'Nowhere'})

function point(lng: number, lat: number, properties: Record<string, unknown>): GeoJSON.Feature {
	return {type: 'Feature', geometry: {type: 'Point', coordinates: [lng, lat]}, properties}
}

describe('pinCollection', () => {
	test('one point per place, carrying its id and name', () => {
		expect(pinCollection([at('a', 1, 2), at('b', 3, 4)])).toEqual({
			type: 'FeatureCollection',
			features: [
				point(1, 2, {buildingId: 'a', name: 'a'}),
				point(3, 4, {buildingId: 'b', name: 'b'}),
			],
		})
	})

	// Every place on both campuses has a point today; one without is listed
	// in the sheet but has nowhere to go on the map.
	test('skips a place with no point', () => {
		expect(pinCollection([unpinned, at('a', 1, 2)]).features).toHaveLength(1)
	})
})

describe('pinBounds', () => {
	test('the box around several pins', () => {
		expect(pinBounds([at('a', 1, 4), at('b', 3, 2)])).toEqual([1, 2, 3, 4])
	})

	// A zero-area box clamps MapLibre to its maximum zoom.
	test('nothing for one pin, or none', () => {
		expect(pinBounds([at('a', 1, 2)])).toBeUndefined()
		expect(pinBounds([unpinned])).toBeUndefined()
		expect(pinBounds([])).toBeUndefined()
	})
})

describe('pressedPin', () => {
	test('a pin names its place', () => {
		expect(pressedPin([point(1, 2, {buildingId: 'a', name: 'a'})], [1, 2])).toEqual({
			kind: 'pin',
			buildingId: 'a',
		})
	})

	test('a cluster names its id and where it is', () => {
		expect(
			pressedPin([point(1, 2, {cluster: true, cluster_id: 7, point_count: 3})], [1, 2]),
		).toEqual({
			kind: 'cluster',
			clusterId: 7,
			center: [1, 2],
		})
	})

	// A touch's hitbox can cover two clusters; the one under the finger wins,
	// not whichever MapLibre lists first.
	test('picks the feature nearest the touch', () => {
		let far = point(0, 0, {cluster: true, cluster_id: 1, point_count: 3})
		let near = point(10, 10, {cluster: true, cluster_id: 2, point_count: 16})
		expect(pressedPin([far, near], [9, 9])).toMatchObject({kind: 'cluster', clusterId: 2})
	})

	test('nothing for an empty press or an unknown feature', () => {
		expect(pressedPin([], [0, 0])).toBeNull()
		expect(pressedPin([point(1, 2, {})], [1, 2])).toBeNull()
	})
})

describe('framingFor', () => {
	test('fits several pins', () => {
		expect(framingFor([at('a', 1, 4), at('b', 3, 2)])).toEqual({kind: 'fit', bounds: [1, 2, 3, 4]})
	})

	test('eases to a single pin', () => {
		expect(framingFor([at('a', 1, 2)])).toEqual({kind: 'ease', center: [1, 2]})
	})

	test('does nothing with no pins', () => {
		expect(framingFor([])).toBeNull()
		expect(framingFor([unpinned])).toBeNull()
	})
})

describe('pinIds', () => {
	// A cluster's leaves come back as the pins' own GeoJSON features.
	test("the places a cluster's pins stand for", () => {
		expect(
			pinIds([
				point(1, 2, {buildingId: 'a', name: 'a'}),
				point(3, 4, {buildingId: 'b', name: 'b'}),
			]),
		).toEqual(['a', 'b'])
	})

	test('skips a feature that names no place', () => {
		expect(pinIds([point(1, 2, {}), point(3, 4, {buildingId: 'b', name: 'b'})])).toEqual(['b'])
	})
})
