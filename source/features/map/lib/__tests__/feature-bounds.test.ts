import {describe, expect, test} from '@jest/globals'
import {featureBounds} from '../feature-bounds'
import {makeBuilding} from '../../__tests__/fixtures'
import type {Feature, Building, GeometryCollection} from '../../types'

function withGeometry(geometry: GeometryCollection): Feature<Building> {
	return {...makeBuilding({id: 'toh', name: 'Tomson Hall'}), geometry}
}

describe('featureBounds', () => {
	test('bounds a single Polygon to its ring', () => {
		let feature = withGeometry({
			type: 'GeometryCollection',
			geometries: [
				{
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
				},
			],
		})

		expect(featureBounds(feature)).toEqual([-93.18, 44.46, -93.17, 44.47])
	})

	test('bounds a MultiPolygon across all of its disjoint wings', () => {
		let feature = withGeometry({
			type: 'GeometryCollection',
			geometries: [
				{
					type: 'MultiPolygon',
					coordinates: [
						[
							[
								[-93.2, 44.5],
								[-93.19, 44.5],
								[-93.19, 44.51],
							],
						],
						[
							[
								[-93.15, 44.4],
								[-93.14, 44.4],
								[-93.14, 44.41],
							],
						],
					],
				},
			],
		})

		expect(featureBounds(feature)).toEqual([-93.2, 44.4, -93.14, 44.51])
	})

	test('ignores Point geometry when a Polygon is also present', () => {
		let feature = withGeometry({
			type: 'GeometryCollection',
			geometries: [
				{type: 'Point', coordinates: [-93.175, 44.465]},
				{
					type: 'Polygon',
					coordinates: [
						[
							[-93.18, 44.46],
							[-93.17, 44.46],
							[-93.17, 44.47],
							[-93.18, 44.47],
						],
					],
				},
			],
		})

		expect(featureBounds(feature)).toEqual([-93.18, 44.46, -93.17, 44.47])
	})

	test('falls back to a Point when no polygon exists', () => {
		let feature = withGeometry({
			type: 'GeometryCollection',
			geometries: [{type: 'Point', coordinates: [-93.175, 44.465]}],
		})

		expect(featureBounds(feature)).toEqual([-93.175, 44.465, -93.175, 44.465])
	})

	test('returns undefined for a feature with no geometry at all', () => {
		let feature = withGeometry({type: 'GeometryCollection', geometries: []})

		expect(featureBounds(feature)).toBeUndefined()
	})
})
