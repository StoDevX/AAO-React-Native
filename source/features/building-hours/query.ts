import {clientFor} from '@frogpond/api'
import type {BreakCalendarResponse} from '@frogpond/schedules'
import {useNowOverride} from '@frogpond/timer'
import {groupBy} from '@frogpond/collections'
import {queryOptions, useQuery, UseQueryResult} from '@tanstack/react-query'

import {campusById, type CampusId} from '../../campuses'
import {queryClient} from '../../init/tanstack-query'
import {useAppSelector} from '../../redux/hooks'
import {favoriteNamesForCampus, selectFavoriteBuildings} from '../../redux/parts/buildings'
import {sectionServer} from '../campus/section-server'
import {BuildingType} from './types'
import {FAVORITES_TITLE} from './lib/listed-sections'
import {withBreakInEffect} from './lib/break-in-effect'
import {useForceBundledData} from './dev/data-source-store'

export const keys = {
	/** Campus first, so it namespaces by campus -- two campuses' cached
	 * buildings can never collide, even though several venue names (Bookstore,
	 * Post Office, ...) exist on both. The map's geojson joins this namespace. */
	all: (campus: CampusId) => [campus, 'buildings'] as const,
}

/** A campus's hours with no break applied, and its break calendar if it keeps one. */
type UneditedHours = {buildings: BuildingType<unknown>[]; calendar?: BreakCalendarResponse}

/**
 * The hours as the dev sheet's moved clock needs them: the server's usual
 * schedules (`?breaks=none`) and the break calendar, so the app can apply
 * whichever break the frozen moment falls in. Kept as long as the server's own
 * answer, so moving the clock re-applies without asking again.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const uneditedHoursOptions = (campus: CampusId) =>
	queryOptions({
		queryKey: [campus, 'unedited-hours'],
		queryFn: async ({signal}): Promise<UneditedHours> => {
			let client = clientFor(sectionServer(campus, campusById(campus).hours))
			let [hours, calendar] = await Promise.all([
				client
					.get('spaces/hours', {signal, searchParams: {breaks: 'none'}})
					.json<{data: BuildingType<unknown>[]}>(),
				// Only a campus whose server keeps a break calendar has one.
				client
					.get('breaks', {signal})
					.json<BreakCalendarResponse>()
					.catch(() => undefined),
			])
			return {buildings: hours.data, calendar}
		},
		staleTime: 10 * 60 * 1000,
	})

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

		// The server answers for today, with any break's hours already in place
		// of the usual ones. A clock moved in the dev sheet applies the break of
		// its own moment instead, or it would show today's break on some other day.
		let frozen = useNowOverride.getState().frozen
		if (frozen) {
			let {buildings, calendar} = await queryClient.query(uneditedHoursOptions(campus))
			return withBreakInEffect(buildings, calendar, frozen.valueOf()) as BuildingType[]
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
