import {clientFor} from '@frogpond/api'
import {servesBundledFixtures} from '@frogpond/launch-arguments'
import {queryOptions, useQuery, UseQueryResult} from '@tanstack/react-query'
import {useAppSelector} from '../../redux/hooks'
import {favoriteNamesForCampus, selectFavoriteBuildings} from '../../redux/parts/buildings'
import bundledBuildings from '../../../docs/building-hours.json'
import {BuildingType, Campus} from './types'
import {FAVORITES_TITLE} from './lib/listed-sections'
import {useForceBundledData} from './dev/data-source-store'
import {groupBy} from '@frogpond/collections'
import {isCampusId} from '../../campuses'
import {campusIdOfLegacy, legacyCampusOf} from '../campus/store'

/**
 * Narrows a route's `?campus=` param to a known `Campus`, falling back to
 * St. Olaf for anything else -- an unrecognised value should never crash the
 * screen or reach a client picked by casting an arbitrary string.
 */
export function parseCampus(value: string | undefined): Campus {
	// A tile's reverse-DNS id and an older link's legacy id both read, until
	// the route's campus param is read as a campus id throughout.
	if (isCampusId(value)) {
		return legacyCampusOf(value)
	}
	return value === 'carleton' ? 'carleton' : 'stolaf'
}

export const keys = {
	/** Campus first, so it namespaces by campus -- the two campuses' cached
	 * buildings can never collide, even though several venue names (Bookstore,
	 * Post Office, ...) exist on both. The map's geojson joins this namespace
	 * when St. Olaf's lands. */
	all: (campus: Campus) => [campus, 'buildings'] as const,
}

function fetchBuildings(campus: Campus) {
	return async ({signal}: {signal: AbortSignal}): Promise<BuildingType[]> => {
		// UI tests naming no campus assert against what a screen does with a venue, so they need
		// the same venues every run, and they need this repository's copy rather
		// than the deployed one -- a `building` key added here only reaches the
		// server once it merges, and a test for it would fail in between for a
		// reason nobody could act on. Carleton's data lives outside this
		// repository, so it still comes over the wire.
		//
		// The dev override takes the same route, for the same reason: a field
		// added here is invisible on a device until the server has it.
		let forced = useForceBundledData.getState().forced
		if ((servesBundledFixtures || forced) && campus === 'stolaf') {
			return (bundledBuildings as {data: BuildingType[]}).data
		}

		let response = await clientFor(campusIdOfLegacy(campus)).get('spaces/hours', {signal}).json()
		return (response as {data: BuildingType[]}).data
	}
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const buildingsOptions = (campus: Campus) =>
	queryOptions({
		queryKey: keys.all(campus),
		queryFn: fetchBuildings(campus),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const buildingByNameOptions = (campus: Campus, name: string) =>
	queryOptions({
		// Shares buildingsOptions' key on purpose: the detail sheet reads the
		// list query's warm cache instead of showing its own spinner.
		queryKey: keys.all(campus),
		queryFn: fetchBuildings(campus),
		select: (buildings) => buildings.find((b) => b.name === name),
	})

export function useGroupedBuildings(
	campus: Campus,
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
