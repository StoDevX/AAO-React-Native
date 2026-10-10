import {clientFor} from '@frogpond/api'
import type {BreakCalendarResponse} from '@frogpond/schedules'
import {groupBy} from '@frogpond/collections'
import {queryOptions, useQuery, UseQueryResult} from '@tanstack/react-query'

import {campusById, type CampusId} from '../../campuses'
import {useAppSelector} from '../../redux/hooks'
import {favoriteNamesForCampus, selectFavoriteBuildings} from '../../redux/parts/buildings'
import {sectionServer} from '../campus/section-server'
import {BuildingType} from './types'
import {FAVORITES_TITLE} from './lib/listed-sections'
import {hasBreakSchedules, withBreakInEffect} from './lib/break-in-effect'
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
		// The dev override reads this repository's copy rather than the deployed
		// one, so a `building` key added here can be tried before it merges. A
		// campus with no bundled copy still comes over the wire.
		let forced = useForceBundledData.getState().forced
		if (forced && hours?.bundled) {
			return [...hours.bundled]
		}

		let client = clientFor(sectionServer(campus, hours))
		let response = await client.get('spaces/hours', {signal}).json()
		let buildings = (response as {data: BuildingType<unknown>[]}).data
		if (!hasBreakSchedules(buildings)) return buildings as BuildingType[]

		// Without the calendar the usual hours still show; a break just isn't applied.
		let calendar = await client
			.get('breaks', {signal})
			.json<BreakCalendarResponse>()
			.catch(() => undefined)
		return withBreakInEffect(buildings, calendar, Date.now()) as BuildingType[]
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
