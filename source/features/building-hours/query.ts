import {clientFor} from '@frogpond/api'
import {groupBy} from '@frogpond/collections'
import {servesBundledFixtures} from '@frogpond/launch-arguments'
import {queryOptions, useQuery, UseQueryResult} from '@tanstack/react-query'

import {campusById, type CampusId} from '../../campuses'
import {useAppSelector} from '../../redux/hooks'
import {favoriteNamesForCampus, selectFavoriteBuildings} from '../../redux/parts/buildings'
import {sectionServer} from '../campus/section-server'
import {BuildingType} from './types'
import {FAVORITES_TITLE} from './lib/listed-sections'
import {useForceBundledData} from './dev/data-source-store'

export const keys = {
	/** Campus first, so it namespaces by campus -- two campuses' cached
	 * buildings can never collide, even though several venue names (Bookstore,
	 * Post Office, ...) exist on both. The map's geojson joins this namespace. */
	all: (campus: CampusId) => [campus, 'buildings'] as const,
}

function fetchBuildings(campus: CampusId) {
	return async ({signal}: {signal: AbortSignal}): Promise<BuildingType[]> => {
		let hours = campusById(campus).hours
		// UI tests naming no campus assert against what a screen does with a
		// venue, so they need the same venues every run, and this repository's
		// copy rather than the deployed one -- a `building` key added here only
		// reaches the server once it merges. A campus with no bundled copy
		// still comes over the wire.
		//
		// The dev override takes the same route, for the same reason.
		let forced = useForceBundledData.getState().forced
		if ((servesBundledFixtures || forced) && hours?.bundled) {
			return [...hours.bundled]
		}

		let response = await clientFor(sectionServer(campus, hours))
			.get('spaces/hours', {signal})
			.json()
		return (response as {data: BuildingType[]}).data
	}
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const buildingsOptions = (campus: CampusId) =>
	queryOptions({
		queryKey: keys.all(campus),
		queryFn: fetchBuildings(campus),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const buildingByNameOptions = (campus: CampusId, name: string) =>
	queryOptions({
		// Shares buildingsOptions' key on purpose: the detail sheet reads the
		// list query's warm cache instead of showing its own spinner.
		queryKey: keys.all(campus),
		queryFn: fetchBuildings(campus),
		select: (buildings) => buildings.find((b) => b.name === name),
	})

export function useGroupedBuildings(
	campus: CampusId,
): UseQueryResult<Array<{title: string; data: BuildingType[]}>, unknown> {
	let favoriteBuildings = useAppSelector(selectFavoriteBuildings)

	return useQuery({
		...buildingsOptions(campus),
		select: (buildings) => {
			let favoriteNames = new Set(favoriteNamesForCampus(favoriteBuildings, campus))
			let favoritesGroup = {
				title: FAVORITES_TITLE,
				data: buildings.filter((b) => favoriteNames.has(b.name)),
			}

			let grouped = groupBy(buildings, (b) => b.category || 'Other')
			let groupedBuildings = Object.entries(grouped).map(([key, value]) => ({
				title: key,
				data: value,
			}))

			if (favoritesGroup.data.length > 0) {
				groupedBuildings = [favoritesGroup, ...groupedBuildings]
			}

			return groupedBuildings
		},
	})
}
