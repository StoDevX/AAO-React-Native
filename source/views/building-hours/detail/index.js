// @flow

import * as React from 'react'
import type {BuildingType} from '../types'
import moment from 'moment-timezone'
import {BuildingDetail} from './building'
import {CENTRAL_TZ} from '../lib'
import type {TopLevelViewPropsType} from '../../types'
import {ConnectedBuildingFavoriteButton as FavoriteButton} from './toolbar-button'

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {building: BuildingType}}},
}

type State = {now: moment}

export class BuildingHoursDetailView extends React.PureComponent<Props, State> {
	static navigationOptions = ({navigation}: any) => {
		const building = navigation.state.params.building
		return {
			title: building.name,
			headerRight: <FavoriteButton buildingName={building.name} />,
		}
	}

	_intervalId: ?IntervalID

	state = {
		// now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
		now: moment.tz(CENTRAL_TZ),
	}

	componentDidMount() {
		// This updates the screen every second, so that the building
		// info statuses are updated without needing to leave and come back.
		this._intervalId = setInterval(this.updateTime, 1000)
	}

	componentWillUnmount() {
		this._intervalId && clearInterval(this._intervalId)
	}

	updateTime = () => {
		this.setState(() => ({now: moment.tz(CENTRAL_TZ)}))
	}

	reportProblem = () => {
		this.props.navigation.navigate('BuildingHoursProblemReportView', {
			initialBuilding: this.props.navigation.state.params.building,
		})
	}

	render() {
		const info = this.props.navigation.state.params.building
		const {now} = this.state

		return (
			<BuildingDetail
				info={info}
				now={now}
				onProblemReport={this.reportProblem}
			/>
		)
	}
}
