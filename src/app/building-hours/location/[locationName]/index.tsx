import * as React from 'react'
import {useMomentTimer} from '@frogpond/timer'
import {BuildingDetail} from '../../../../views/building-hours/detail/building'
import {timezone} from '@frogpond/constants'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {
	selectFavoriteBuildings,
	useAppDispatch,
	useAppSelector,
} from '../../../../redux'
import {toggleFavoriteBuilding} from '../../../../redux/parts/buildings'
import {useCallback} from 'react'
import {useSingleBuilding} from '../../../../views/building-hours/query'
import {NoticeView} from '@frogpond/notice'

export default function BuildingHoursDetailView(): React.JSX.Element {
	let router = useRouter()
	let dispatch = useAppDispatch()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let {locationName} =
		useLocalSearchParams<'/building-hours/location/[locationName]'>()
	let query = useSingleBuilding(locationName)

	let favorites = useAppSelector(selectFavoriteBuildings)
	let favorited = favorites.includes(locationName)
	let onFavorite = useCallback(
		() => dispatch(toggleFavoriteBuilding(locationName)),
		[dispatch, locationName],
	)

	let onProblemReport = useCallback(() => {
		router.navigate({
			pathname: '/building-hours/location/[locationName]/edit',
			params: {locationName},
		})
	}, [locationName, router])

	if (query.isError) {
		return (
			<NoticeView text={`Error loading building: ${query.error.message}`} />
		)
	}

	if (query.isPending) {
		return <NoticeView text="Loading..." />
	}

	return (
		<>
			<Stack.Screen options={{title: query.data.name}} />
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					icon={favorited ? 'star.fill' : 'star'}
					onPress={() => onFavorite()}
				/>
			</Stack.Toolbar>

			<BuildingDetail
				info={query.data}
				now={now}
				onProblemReport={onProblemReport}
			/>
		</>
	)
}
