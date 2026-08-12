import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {useMomentTimer} from '@frogpond/timer'
import {timezone} from '@frogpond/constants'

import {BuildingDetail} from '../../../source/features/building-hours/detail/building'
import {buildingByNameOptions} from '../../../source/features/building-hours/query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useAppDispatch, useAppSelector} from '../../../source/redux/hooks'
import {
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../../source/redux/parts/buildings'

export default function BuildingHoursDetailPage(): React.ReactNode {
	let dispatch = useAppDispatch()
	let router = useRouter()

	let {name} = useLocalSearchParams<{name: string}>()
	let {
		data: building,
		isLoading,
		error,
		refetch,
	} = useQuery(buildingByNameOptions(name))

	let favorites = useAppSelector(selectFavoriteBuildings)

	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})

	let onFavorite = React.useCallback(
		() => dispatch(toggleFavoriteBuilding(name)),
		[dispatch, name],
	)

	let reportProblem = React.useCallback(
		() =>
			router.push({
				pathname: '/BuildingHoursProblemReport',
				params: {name},
			}),
		[name, router],
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
			<BuildingDetail
				info={building}
				now={now}
				onProblemReport={reportProblem}
			/>
		</>
	)
}
