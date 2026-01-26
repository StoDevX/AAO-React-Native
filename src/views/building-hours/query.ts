import {client} from '@frogpond/api'
import {queryOptions, useQuery, UseQueryResult} from '@tanstack/react-query'
import {selectFavoriteBuildings, useAppSelector} from '../../redux'
import {BuildingType} from './types'
import {groupBy} from 'lodash'

export const keys = {
	all: ['buildings'] as const,
}

export const groupedBuildingsQueryOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client
			.get<{data: BuildingType[]}>('spaces/hours', {signal})
			.json()
		return response.data
	},
})

export function useGroupedBuildings(): UseQueryResult<
	Array<{title: string; data: BuildingType[]}>
> {
	let favoriteBuildings = useAppSelector(selectFavoriteBuildings)

	return useQuery({
		...groupedBuildingsQueryOptions,
		select: (buildings) => {
			let favoritesGroup = {
				title: 'Favorites',
				data: buildings.filter((b) => favoriteBuildings.includes(b.name)),
			}

			let grouped = groupBy(buildings, (b) => b.category || 'Other')
			let groupedBuildings = Object.entries(grouped).map(([key, value]) => ({
				title: key,
				data: value ?? [],
			}))

			if (favoritesGroup.data.length > 0) {
				groupedBuildings = [favoritesGroup, ...groupedBuildings]
			}

			return groupedBuildings
		},
	})
}

export function useSingleBuilding(name: string): UseQueryResult<BuildingType> {
	return useQuery({
		...groupedBuildingsQueryOptions,
		select: (buildings) => {
			let building = buildings.find((b) => b.name === name)
			if (!building) {
				throw new Error(`Building not found: ${name}`)
			}
			return building
		},
	})
}
