import * as React from 'react'
import type {BuildingType} from '../types'
import {Timer} from '@frogpond/timer'
import {BuildingDetail} from './building'
import {timezone} from '@frogpond/constants'
import type {TopLevelViewPropsType} from '../../types'
import {BuildingFavoriteButton} from './toolbar-button'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useNavigation} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'

type Props = TopLevelViewPropsType & {
	route: {params: {building: BuildingType}}
}

export function BuildingHoursDetailView(props: Props): JSX.Element {
	let navigation = useNavigation()

	let info = props.route.params.building

	let reportProblem = React.useCallback(
		() =>
			navigation.navigate('BuildingHoursProblemReport', {
				initialBuilding: info,
			}),
		[info, navigation],
	)

	return (
		<Timer
			interval={60000}
			moment={true}
			render={({now}) => (
				<BuildingDetail info={info} now={now} onProblemReport={reportProblem} />
			)}
			timezone={timezone()}
		/>
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
