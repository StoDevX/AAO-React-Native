import {carletonClient} from '@frogpond/api'
import {queryOptions, useQuery, UseQueryResult} from '@tanstack/react-query'
import type {Building, Feature, FeatureCollection} from './types'

export const keys = {
	all: ['carleton-map', 'geojson'] as const,
}

export const mapDataOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await carletonClient
			.get('map/geojson', {signal})
			.json<FeatureCollection<Building>>()
		return response.features
	},
	staleTime: 1000 * 60 * 60, // 1 hour — building data changes rarely
})

export function useMapData(): UseQueryResult<
	Array<Feature<Building>>,
	unknown
> {
	return useQuery(mapDataOptions)
}
