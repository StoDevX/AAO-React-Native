import {carletonClient, client} from '@frogpond/api'
import {queryOptions, useQuery, UseQueryResult} from '@tanstack/react-query'
import {groupBy} from 'lodash'
import {selectFavoriteBuildings, useAppSelector} from '../../redux'
import {BuildingType} from './types'

/** The two campuses that serve building hours through this feature. */
export type Campus = 'stolaf' | 'carleton'

export const keys = {
	/// Campus first, so everything for one campus invalidates together -- which
	/// is what a change of server URL asks for. The map's geojson joins this
	/// namespace when St. Olaf's lands.
	all: (campus: Campus) => [campus, 'buildings'] as const,
}

// Both campuses run identical `spaces/hours` schemas on their own ccc-server
// deployments, so only the client and the cache key vary by campus.
function clientFor(campus: Campus): typeof client {
	return campus === 'carleton' ? carletonClient : client
}

function fetchBuildings(campus: Campus) {
	return async ({signal}: {signal: AbortSignal}): Promise<BuildingType[]> => {
		let response = await clientFor(campus).get('spaces/hours', {signal}).json()
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
			let favoritesGroup = {
				title: 'Favorites',
				data: buildings.filter((b) => favoriteBuildings.includes(b.name)),
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
