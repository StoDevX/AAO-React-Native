import {carletonClient, client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import type {Campus} from '../building-hours/query'
import type {Building, Feature, FeatureCollection} from './types'

export const keys = {
	/** Campus first, joining the namespace `building-hours`' key already
	 * uses -- see that key's comment for why. */
	all: (campus: Campus) => [campus, 'map', 'geojson'] as const,
}

/// Building footprints change on the order of once a year, so an hour of
/// staleness costs nothing and saves a request every time the sheet opens.
const staleTime = 1000 * 60 * 60

// Both campuses serve identical `map/geojson` schemas on their own
// ccc-server deployments, so only the client and the cache key vary by
// campus.
function clientFor(campus: Campus): typeof client {
	return campus === 'carleton' ? carletonClient : client
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const mapDataOptions = (campus: Campus) =>
	queryOptions({
		queryKey: keys.all(campus),
		queryFn: async ({signal}): Promise<Array<Feature<Building>>> => {
			let response = await clientFor(campus)
				.get('map/geojson', {signal})
				.json<FeatureCollection<Building>>()
			return response.features
		},
		staleTime,
	})
