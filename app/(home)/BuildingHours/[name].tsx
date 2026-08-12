import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {BuildingHoursDetailView} from '../../../source/views/building-hours'
import {buildingByNameOptions} from '../../../source/views/building-hours/query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useAppDispatch, useAppSelector} from '../../../source/redux/hooks'
import {
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../../source/redux/parts/buildings'

export default function BuildingHoursDetailPage(): React.ReactNode {
	let dispatch = useAppDispatch()

	let {name} = useLocalSearchParams<{name: string}>()
	let {
		data: building,
		isLoading,
		error,
		refetch,
	} = useQuery(buildingByNameOptions(name))

	let favorites = useAppSelector(selectFavoriteBuildings)

	let onFavorite = React.useCallback(
		() => dispatch(toggleFavoriteBuilding(name)),
		[dispatch, name],
	)

	let favorited = favorites.includes(name)

	let screen = (
		<>
			<Stack.Title>{building?.name ?? name}</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					icon={favorited ? 'heart.fill' : 'heart'}
					onPress={onFavorite}
				/>
			</Stack.Toolbar>
		</>
	)

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!building) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the "${name}" building.`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<BuildingHoursDetailView building={building} />
		</>
	)
}
