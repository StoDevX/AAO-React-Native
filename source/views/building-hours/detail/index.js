// @flow

import * as React from 'react'
import type {BuildingType} from '../types'
import {Timer} from '@frogpond/timer'
import {BuildingDetail} from './building'
import {timezone} from '@frogpond/constants'
import type {TopLevelViewPropsType} from '../../types'
import {ConnectedBuildingFavoriteButton as FavoriteButton} from './toolbar-button'

type Props = TopLevelViewPropsType & {
	building: BuildingType,
}

export function BuildingHoursDetailView(props: Props) {
	// static navigationOptions = ({navigation}: any) => {
	// 	const building = navigation.state.params.building
	// 	return {
	// 		title: building.name,
	// 		headerRight: <FavoriteButton buildingName={building.name} />,
	// 	}
	// }

	let reportProblem = () => {
		Navigation.push(this.props.componentId, {
			component: {
				name: 'app.hours.report',
				passProps: {
					initialBuilding: JSON.parse(JSON.stringify(props.building)),
				},
				options: {
					topBar: {
						title: {
							text: 'Report an Issue',
						},
					},
				},
			},
		})
	}

	console.warn(props)
	const info = props.building

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
