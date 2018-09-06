// @flow

import * as React from 'react'
import type {BuildingType} from '../types'
import {Timer} from '@frogpond/timer'
import {BuildingDetail} from './building'
import {CENTRAL_TZ} from '../lib'
import type {TopLevelViewPropsType} from '../../types'
import {ConnectedBuildingFavoriteButton as FavoriteButton} from './toolbar-button'

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {building: BuildingType}}},
}

export class BuildingHoursDetailView extends React.Component<Props> {
	static navigationOptions = ({navigation}: any) => {
		const building = navigation.state.params.building
		return {
			title: building.name,
			headerRight: <FavoriteButton buildingName={building.name} />,
		}
	}

	reportProblem = () => {
		this.props.navigation.navigate('BuildingHoursProblemReportView', {
			initialBuilding: this.props.navigation.state.params.building,
		})
	}

	render() {
		const info = this.props.navigation.state.params.building

		return (
			<Timer
				interval={5000}
				moment={true}
				render={({now}) => (
					<BuildingDetail
						info={info}
						now={now}
						onProblemReport={this.reportProblem}
					/>
				)}
				timezone={CENTRAL_TZ}
			/>
		)
	}
}
