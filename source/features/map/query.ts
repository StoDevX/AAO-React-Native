import {carletonClient} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import type {Building, Feature, FeatureCollection} from './types'

export const keys = {
	all: ['carleton-map', 'geojson'] as const,
}

/// Building footprints change on the order of once a year, so an hour of
/// staleness costs nothing and saves a request every time the sheet opens.
const staleTime = 1000 * 60 * 60

export const mapDataOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}): Promise<Array<Feature<Building>>> => {
		let response = await carletonClient
			.get('map/geojson', {signal})
			.json<FeatureCollection<Building>>()
		return response.features
	},
	staleTime,
})
