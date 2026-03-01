import * as React from 'react'
import {useMomentTimer} from '@frogpond/timer'
import {BuildingDetail} from '../../../views/building-hours/detail/building'
import {timezone} from '@frogpond/constants'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {
	selectFavoriteBuildings,
	useAppDispatch,
	useAppSelector,
} from '../../../redux'
import {toggleFavoriteBuilding} from '../../../redux/parts/buildings'
import {useCallback} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {keys} from '../../../views/building-hours/query'
import {BuildingType} from '../../../views/building-hours/types'
import {Platform, TouchableOpacity, Text} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function BuildingHoursDetailView(): React.JSX.Element {
	let dispatch = useAppDispatch()
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let params = useLocalSearchParams<{location: string}>()
	let locationName = params.location

	let queryClient = useQueryClient()
	let buildings = queryClient.getQueryData<BuildingType[]>(keys.all)
	let info = buildings?.find((b) => b.name === locationName)

	let favorites = useAppSelector(selectFavoriteBuildings)
	let favorited = favorites.includes(locationName)
	let onFavorite = useCallback(
		() => dispatch(toggleFavoriteBuilding(locationName)),
		[dispatch, locationName],
	)

	let onProblemReport = useCallback(() => {
		if (info) {
			router.push({
				pathname: '/building-hours/location/report',
				params: {initialBuilding: JSON.stringify(info)},
			})
		}
	}, [router, info])

	if (!info) {
		return <NoticeView text="Building not found." />
	}

	let starIcon = favorited ? 'star' : 'star-outline'

	return (
		<>
			<Stack.Screen
				options={{
					title: info.name,
					headerRight: () => (
						<TouchableOpacity onPress={onFavorite}>
							{Platform.OS === 'ios' ? (
								<Ionicons color="#007AFF" name={starIcon} size={24} />
							) : (
								<Ionicons color="#007AFF" name={starIcon} size={24} />
							)}
						</TouchableOpacity>
					),
				}}
			/>
			<BuildingDetail info={info} now={now} onProblemReport={onProblemReport} />
		</>
	)
}
