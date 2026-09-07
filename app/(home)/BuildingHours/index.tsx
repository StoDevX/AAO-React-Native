import * as React from 'react'
import {useGroupedBuildings} from '../../../source/features/building-hours/query'
import {BuildingType} from '../../../source/features/building-hours/types'
import {BuildingList} from '../../../source/features/building-hours/list'
import {useAppDispatch, useAppSelector} from '../../../source/redux/hooks'
import {
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../../source/redux/parts/buildings'

import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {Stack, useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'

function BuildingHoursView(): React.ReactNode {
	let router = useRouter()
	let dispatch = useAppDispatch()
	let favorites = useAppSelector(selectFavoriteBuildings)

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute', timezone: timezone()})

	let {data = [], error, refetch, isLoading, isError} = useGroupedBuildings()

	let onToggleFavorite = React.useCallback(
		(building: BuildingType) => dispatch(toggleFavoriteBuilding(building.name)),
		[dispatch],
	)

	let onReport = React.useCallback(
		(building: BuildingType) =>
			router.push({
				pathname: '/BuildingHoursProblemReport',
				params: {name: building.name},
			}),
		[router],
	)

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	if (isLoading) {
		return <LoadingView />
	}

	return (
		<BuildingList
			favorites={favorites}
			isLoading={isLoading}
			now={now}
			onRefresh={refetch}
			onReport={onReport}
			onToggleFavorite={onToggleFavorite}
			sections={data}
		/>
	)
}

export default function BuildingHoursPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Building Hours</Stack.Title>
			<BuildingHoursView />
		</>
	)
}
