import * as React from 'react'
import {useMomentTimer} from '@frogpond/timer'
import {BuildingDetail} from '../../../views/building-hours/detail/building'
import {timezone} from '@frogpond/constants'
import {Stack, useLocalSearchParams} from 'expo-router'
import {
	selectFavoriteBuildings,
	useAppDispatch,
	useAppSelector,
} from '../../../redux'
import {toggleFavoriteBuilding} from '../../../redux/parts/buildings'
import {useCallback} from 'react'

export function BuildingHoursDetailView(): React.JSX.Element {
	let dispatch = useAppDispatch()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let locationName =
		useLocalSearchParams<'/building-hours/location/[location]'>()
	let {building: info} = route.params

	let favorites = useAppSelector(selectFavoriteBuildings)
	let favorited = favorites.includes(locationName)
	let onFavorite = useCallback(
		() => dispatch(toggleFavoriteBuilding(locationName)),
		[dispatch, locationName],
	)

	return (
		<>
			<Stack.Screen options={{title: info.name}} />
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					icon={favorited ? 'star.fill' : 'star'}
					onPress={() => onFavorite()}
				/>
			</Stack.Toolbar>
			<BuildingDetail info={info} now={now} />
		</>
	)
}
