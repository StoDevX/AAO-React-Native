import {describe, expect, test} from '@jest/globals'

import {makeBuilding} from '../../__tests__/fixtures'
import {selectionFor, selectionFraming} from '../selection'
import type {Building, Feature, GeometryCollection} from '../../types'

function place(geometry: GeometryCollection): Feature<Building> {
	return {...makeBuilding({id: 'p', name: 'Knoll Loop'}), geometry}
}

const anchor = {type: 'Point' as const, coordinates: [-93.185, 44.465] as [number, number]}
const trail = place({
	type: 'GeometryCollection',
	geometries: [
		{
			type: 'LineString',
			coordinates: [
				[-93.19, 44.46],
				[-93.185, 44.465],
				[-93.18, 44.47],
			],
		},
		anchor,
	],
})
const splitTrail = place({
	type: 'GeometryCollection',
	geometries: [
		{
			type: 'MultiLineString',
			coordinates: [
				[
					[-93.19, 44.46],
					[-93.185, 44.465],
				],
				[
					[-93.182, 44.468],
					[-93.18, 44.47],
				],
			],
		},
		anchor,
	],
})
const pond = place({
	type: 'GeometryCollection',
	geometries: [
		{
			type: 'Polygon',
			coordinates: [
				[
					[-93.19, 44.46],
					[-93.18, 44.46],
					[-93.18, 44.47],
					[-93.19, 44.46],
				],
			],
		},
		anchor,
	],
})

describe('selectionFor', () => {
	test('draws a trail as its line, named after it', () => {
		expect(selectionFor(trail)).toEqual({
			name: 'Knoll Loop',
			at: [-93.185, 44.465],
			lines: [
				[
					[-93.19, 44.46],
					[-93.185, 44.465],
					[-93.18, 44.47],
				],
			],
		})
	})

	test('draws every part of a trail in several parts', () => {
		expect(selectionFor(splitTrail)?.lines).toHaveLength(2)
	})

	test('draws anything else as a dot', () => {
		expect(selectionFor(pond)).toEqual({name: 'Knoll Loop', at: [-93.185, 44.465], lines: null})
	})

	// verify.py gives every trail an anchor, but the line alone is enough.
	test('draws a trail with no anchor, pinned at its middle vertex', () => {
		let unanchored = place({
			type: 'GeometryCollection',
			geometries: trail.geometry.geometries.filter((geo) => geo.type !== 'Point'),
		})
		expect(selectionFor(unanchored)).toEqual({
			name: 'Knoll Loop',
			at: [-93.185, 44.465],
			lines: [
				[
					[-93.19, 44.46],
					[-93.185, 44.465],
					[-93.18, 44.47],
				],
			],
		})
	})

	test('draws nothing for a place with no anchor', () => {
		expect(selectionFor(place({type: 'GeometryCollection', geometries: []}))).toBeNull()
	})
})

describe('selectionFraming', () => {
	test('fits the whole of a trail', () => {
		expect(selectionFraming(trail)).toEqual({
			kind: 'fit',
			bounds: [-93.19, 44.46, -93.18, 44.47],
		})
	})

	test('eases to anything else', () => {
		expect(selectionFraming(pond)).toEqual({kind: 'ease', center: [-93.185, 44.465]})
	})

	test('fits a trail with no anchor', () => {
		let unanchored = place({
			type: 'GeometryCollection',
			geometries: trail.geometry.geometries.filter((geo) => geo.type !== 'Point'),
		})
		expect(selectionFraming(unanchored)).toEqual({
			kind: 'fit',
			bounds: [-93.19, 44.46, -93.18, 44.47],
		})
	})

	test('leaves the camera alone for a place with no anchor', () => {
		expect(selectionFraming(place({type: 'GeometryCollection', geometries: []}))).toBeNull()
	})
})
