import {describe, expect, test} from '@jest/globals'

import {placeForTap} from '../place-for-tap'

function point(lng: number, lat: number, properties: Record<string, unknown>): GeoJSON.Feature {
	return {type: 'Feature', geometry: {type: 'Point', coordinates: [lng, lat]}, properties}
}

const square: GeoJSON.Feature = {
	type: 'Feature',
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[0, 0],
				[0, 2],
				[2, 2],
				[2, 0],
				[0, 0],
			],
		],
	},
	properties: {buildingId: 'bc'},
}

describe('placeForTap', () => {
	// The Cage's name is drawn inside Buntrock: a tap on it opens The Cage.
	test('opens the labelled place under the touch over the building around it', () => {
		expect(placeForTap([point(1, 1, {buildingId: 'thecage'})], [1, 1], 'bc')).toBe('thecage')
	})

	test('opens the nearest of two labelled places', () => {
		let features = [point(0, 0, {buildingId: 'far'}), point(10, 10, {buildingId: 'near'})]
		expect(placeForTap(features, [9, 9], 'bc')).toBe('near')
	})

	// A building's own shape carries its id too; only a drawn name should win.
	test('ignores anything that is not a point', () => {
		expect(placeForTap([square], [1, 1], 'bc')).toBe('bc')
	})

	test('ignores a point that names no place', () => {
		expect(placeForTap([point(1, 1, {name: 'Water Tank'})], [1, 1], 'bc')).toBe('bc')
	})

	test('falls back to the building, or to nothing off every building', () => {
		expect(placeForTap([], [1, 1], 'bc')).toBe('bc')
		expect(placeForTap([], [1, 1], null)).toBeNull()
	})
})
