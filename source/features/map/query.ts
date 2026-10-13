import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {campusById, type CampusId} from '../../campuses'
import {sectionServer} from '../campus/section-server'
import type {Building, Feature, FeatureCollection} from './types'

export const keys = {
	/** Campus first, joining the namespace `building-hours`' key already
	 * uses -- see that key's comment for why. */
	all: (campus: CampusId) => [campus, 'map', 'geojson'] as const,
}

/// Building footprints change on the order of once a year, so an hour of
/// staleness costs nothing and saves a request every time the sheet opens.
const staleTime = 1000 * 60 * 60

/// A campus's map: its own server's `map/geojson`, unless its map section
/// names another. Every campus serves the same schema.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const mapDataOptions = (campus: CampusId) =>
	queryOptions({
		queryKey: keys.all(campus),
		queryFn: async ({signal}): Promise<Array<Feature<Building>>> => {
			let response = await clientFor(sectionServer(campus, campusById(campus).map))
				.get('map/geojson', {signal})
				.json<FeatureCollection<Building>>()
			return response.features
		},
		staleTime,
	})
