import {describe, expect, test} from '@jest/globals'

import {placeForTap, tapCandidates} from '../place-for-tap'

function point(lng: number, lat: number, properties: Record<string, unknown>): GeoJSON.Feature {
	return {type: 'Feature', geometry: {type: 'Point', coordinates: [lng, lat]}, properties}
}

function line(
	coordinates: Array<[number, number]>,
	properties: Record<string, unknown>,
): GeoJSON.Feature {
	return {type: 'Feature', geometry: {type: 'LineString', coordinates}, properties}
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

	// The tiles draw each named trail with its id; the touch lands on its course,
	// between two vertices.
	test('opens the trail whose line is under the touch', () => {
		let trail = line(
			[
				[0, 0],
				[4, 0],
			],
			{buildingId: 'trail-knollloop'},
		)
		expect(placeForTap([trail], [2, 0.1], null)).toBe('trail-knollloop')
	})

	test('opens a trail drawn in several parts', () => {
		let trail: GeoJSON.Feature = {
			type: 'Feature',
			geometry: {
				type: 'MultiLineString',
				coordinates: [
					[
						[0, 0],
						[1, 0],
					],
					[
						[3, 3],
						[4, 3],
					],
				],
			},
			properties: {buildingId: 'trail-bigwoodstrail'},
		}
		expect(placeForTap([trail], [3.5, 3], null)).toBe('trail-bigwoodstrail')
	})

	test('opens a name nearer the touch than a trail beside it', () => {
		let trail = line(
			[
				[0, 0],
				[4, 0],
			],
			{buildingId: 'trail-prairieloop'},
		)
		let pond = point(2, 1, {buildingId: 'pond-bigpond'})
		expect(placeForTap([trail, pond], [2, 0.9], null)).toBe('pond-bigpond')
	})

	test('opens a trail nearer the touch than a name beside it', () => {
		let trail = line(
			[
				[0, 0],
				[4, 0],
			],
			{buildingId: 'trail-prairieloop'},
		)
		let pond = point(2, 1, {buildingId: 'pond-bigpond'})
		expect(placeForTap([trail, pond], [2, 0.1], null)).toBe('trail-prairieloop')
	})

	// A trail crossing a tile edge comes back as one piece per tile.
	test('opens a trail clipped into several features by the tiles', () => {
		let pieces = [
			line(
				[
					[0, 0],
					[2, 0],
				],
				{buildingId: 'trail-conifertrail'},
			),
			line(
				[
					[2, 0],
					[4, 0],
				],
				{buildingId: 'trail-conifertrail'},
			),
		]
		expect(placeForTap(pieces, [3, 0], 'bc')).toBe('trail-conifertrail')
	})

	// A pond's loop hugs its shore: a touch in the water is within a label's
	// reach of the trail, but not on it, and opens the pond.
	test('opens the pond under the touch over a trail that only passes near it', () => {
		let trail = line(
			[
				[0, 0],
				[4, 0],
			],
			{buildingId: 'trail-baseballpondloop'},
		)
		expect(placeForTap(tapCandidates([trail], []), [2, 0.5], 'pond-baseballpond')).toBe(
			'pond-baseballpond',
		)
	})

	test('opens a trail the touch is on, over the pond beside it', () => {
		let trail = line(
			[
				[0, 0],
				[4, 0],
			],
			{buildingId: 'trail-baseballpondloop'},
		)
		expect(placeForTap(tapCandidates([trail], [trail]), [2, 0], 'pond-baseballpond')).toBe(
			'trail-baseballpondloop',
		)
	})

	test('takes names from the wide reach, whatever the close one holds', () => {
		let name = point(1, 1, {buildingId: 'thecage'})
		expect(tapCandidates([name], [])).toEqual([name])
	})
})
