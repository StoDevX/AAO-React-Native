import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {groupBy} from 'lodash'
import {useSelector} from 'react-redux'
import {selectFavoriteBuildings} from '../../redux'
import {BuildingType} from './types'

export const keys = {
	all: ['buildings'] as const,
}

export function useGroupedBuildings(): UseQueryResult<
	Array<{title: string; data: BuildingType[]}>,
	unknown
> {
	let favoriteBuildings = useSelector(selectFavoriteBuildings)

	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('/spaces/hours', {signal}).json()
			return (response as {data: BuildingType[]}).data
		},
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
