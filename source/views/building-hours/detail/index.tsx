import * as React from 'react'

import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {timezone} from '@frogpond/constants'
import {useMomentTimer} from '@frogpond/timer'

import {RootStackParamList} from '../../../navigation/types'
import {BuildingDetail} from './building'
import {BuildingFavoriteButton} from './toolbar-button'

export function BuildingHoursDetailView(): JSX.Element {
	let navigation = useNavigation()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {building: info} = route.params

	let reportProblem = React.useCallback(
		() =>
			navigation.navigate('BuildingHoursProblemReport', {
				initialBuilding: info,
			}),
		[info, navigation],
	)

	return (
		<BuildingDetail info={info} now={now} onProblemReport={reportProblem} />
	)
}

export const NavigationKey = 'BuildingHoursDetail'

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {name} = props.route.params.building
	return {
		title: name,
		headerRight: (p) => <BuildingFavoriteButton {...p} buildingName={name} />,
	}
}
