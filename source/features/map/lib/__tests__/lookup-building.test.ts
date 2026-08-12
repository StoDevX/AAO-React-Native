import {expect, it} from '@jest/globals'
import {lookupBuildingByCoordinates} from '../lookup-building'
import type {Building, Feature} from '../../types'

const square: Feature<Building>['geometry'] = {
	type: 'GeometryCollection',
	geometries: [
		{
			type: 'Polygon',
			coordinates: [
				[
					[0, 0],
					[10, 0],
					[10, 10],
					[0, 10],
					[0, 0],
				],
			],
		},
		{type: 'Point', coordinates: [5, 5]},
	],
}

const make = (
	id: string,
	geometry: Feature<Building>['geometry'],
): Feature<Building> => ({
	type: 'Feature',
	id,
	geometry,
	properties: {
		accessibility: 'unknown',
		address: null,
		categories: ['building'],
		departments: [],
		description: '',
		floors: [],
		name: id,
		nickname: '',
		offices: [],
	},
})

it('returns the feature whose polygon contains the point', () => {
	let result = lookupBuildingByCoordinates([5, 5], [make('A', square)])
	expect(result?.id).toBe('A')
})

it('returns undefined when the point is outside every polygon', () => {
	let result = lookupBuildingByCoordinates([99, 99], [make('A', square)])
	expect(result).toBeUndefined()
})

it('skips features that have no polygon geometry', () => {
	let pointOnly: Feature<Building>['geometry'] = {
		type: 'GeometryCollection',
		geometries: [{type: 'Point', coordinates: [5, 5]}],
	}
	let result = lookupBuildingByCoordinates(
		[5, 5],
		[make('point-only', pointOnly), make('A', square)],
	)
	expect(result?.id).toBe('A')
})

it('returns the first matching feature when multiple polygons overlap', () => {
	let result = lookupBuildingByCoordinates(
		[5, 5],
		[make('A', square), make('B', square)],
	)
	expect(result?.id).toBe('A')
})
