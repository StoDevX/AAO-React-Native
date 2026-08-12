import {expect, it} from '@jest/globals'
import {toBuildingFootprints} from '../building-footprints'
import type {Building, Feature, Polygon, Ring} from '../../types'

const ring = (x: number): Ring => [
	[x, 0],
	[x + 1, 0],
	[x + 1, 1],
	[x, 1],
	[x, 0],
]

const polygon = (x: number): Polygon => ({
	type: 'Polygon',
	coordinates: [ring(x)],
})

const make = (
	id: string,
	geometries: Feature<Building>['geometry']['geometries'],
): Feature<Building> => ({
	type: 'Feature',
	id,
	geometry: {type: 'GeometryCollection', geometries},
	properties: {
		accessibility: 'unknown',
		address: null,
		categories: ['building'],
		departments: [],
		description: '',
		floors: [],
		name: `Name of ${id}`,
		nickname: '',
		offices: [],
	},
})

it('unwraps the GeometryCollection MapLibre cannot render', () => {
	let result = toBuildingFootprints([
		make('a', [polygon(0), {type: 'Point', coordinates: [0.5, 0.5]}]),
	])

	expect(result.type).toBe('FeatureCollection')
	expect(result.features).toHaveLength(1)
	expect(result.features[0].geometry.type).toBe('MultiPolygon')
})

it('gathers a multi-wing building into one MultiPolygon feature', () => {
	let result = toBuildingFootprints([make('wings', [polygon(0), polygon(10)])])

	expect(result.features).toHaveLength(1)
	expect(result.features[0].geometry.coordinates).toHaveLength(2)
})

it('carries the id in properties, where the press event reads it', () => {
	let result = toBuildingFootprints([make('a', [polygon(0)])])

	expect(result.features[0].id).toBe('a')
	expect(result.features[0].properties).toEqual({
		buildingId: 'a',
		name: 'Name of a',
	})
})

it('drops features that have no polygon to draw', () => {
	let result = toBuildingFootprints([
		make('point-only', [{type: 'Point', coordinates: [0.5, 0.5]}]),
		make('a', [polygon(0)]),
	])

	expect(result.features.map((f) => f.id)).toEqual(['a'])
})

it('returns an empty collection for no buildings', () => {
	expect(toBuildingFootprints([])).toEqual({
		type: 'FeatureCollection',
		features: [],
	})
})
