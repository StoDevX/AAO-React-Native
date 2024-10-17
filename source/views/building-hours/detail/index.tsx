import * as React from 'react'
import {useMomentTimer} from '@frogpond/timer'
import {BuildingDetail} from './building'
import {timezone} from '@frogpond/constants'
import {BuildingFavoriteButton} from './toolbar-button'
import {NativeStackNavigationOptions} from 'expo-router-stack'
import {RouteProp, useNavigation, useRoute} from 'expo-router'
import {RootStackParamList} from '../../../navigation/types'

export function BuildingHoursDetailView(): React.JSX.Element {
	let navigation = useNavigation()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {building: info} = route.params

	let reportProblem = React.useCallback(() => {
		navigation.navigate('BuildingHoursProblemReport', {
			initialBuilding: info,
		})
	}, [info, navigation])

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
