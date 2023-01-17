import {client} from '@frogpond/api'
import {useQuery} from '@tanstack/react-query'
import {groupBy} from 'lodash'
import {useSelector} from 'react-redux'
import {selectFavoriteBuildings} from '../../redux'
import {BuildingType} from './types'

export async function fetchBuildingHours() {
	let response = await client.get('/spaces/hours').json()
	return (response as {data: BuildingType[]}).data
}

export function useBuildings() {
	return useQuery({
		queryKey: ['buildings'],
		queryFn: fetchBuildingHours,
	})
}

export function useGroupedBuildings() {
	let favoriteBuildings = useSelector(selectFavoriteBuildings)

	return useQuery({
		queryKey: ['buildings'],
		queryFn: fetchBuildingHours,
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
