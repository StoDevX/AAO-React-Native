// @flow

import * as React from 'react'
import {NoticeView} from '@frogpond/notice'
import {BuildingHoursList} from './list'
import {type ReduxState} from '../../redux'
import {connect} from 'react-redux'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'
import * as defaultData from '../../../docs/building-hours.json'
import {reportNetworkProblem} from '@frogpond/analytics'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import delay from 'delay'
import {CENTRAL_TZ} from './lib'
import {API} from '@frogpond/api'
import {Timer} from '@frogpond/timer'

const buildingHoursUrl = API('/spaces/hours')

const groupBuildings = (buildings: BuildingType[], favorites: string[]) => {
	const favoritesGroup = {
		title: 'Favorites',
		data: buildings.filter(b => favorites.includes(b.name)),
	}

	const grouped = groupBy(buildings, b => b.category || 'Other')
	let groupedBuildings = toPairs(grouped).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	if (favoritesGroup.data.length > 0) {
		groupedBuildings = [favoritesGroup, ...groupedBuildings]
	}

	return groupedBuildings
}

type ReduxStateProps = {
	favoriteBuildings: Array<string>,
}

type Props = TopLevelViewPropsType & ReduxStateProps

type State = {
	error: ?Error,
	loading: boolean,
	buildings: Array<{title: string, data: Array<BuildingType>}>,
	allBuildings: Array<BuildingType>,
}

export class BuildingHoursView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Building Hours',
		headerBackTitle: 'Hours',
	}

	state = {
		error: null,
		loading: false,
		buildings: groupBuildings(defaultData.data, this.props.favoriteBuildings),
		allBuildings: defaultData.data,
		intervalId: null,
	}

	static getDerivedStateFromProps(nextProps: Props, prevState: State) {
		return {
			buildings: groupBuildings(
				prevState.allBuildings,
				nextProps.favoriteBuildings,
			),
		}
	}

	componentDidMount() {
		this.fetchData()
	}

	refresh = async (): any => {
		let start = Date.now()
		this.setState(() => ({loading: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({loading: false}))
	}

	fetchData = async () => {
		let {data: buildings} = await fetchJson(buildingHoursUrl).catch(err => {
			reportNetworkProblem(err)
			return defaultData
		})
		if (process.env.NODE_ENV === 'development') {
			buildings = defaultData.data
		}
		this.setState(() => ({
			buildings: groupBuildings(buildings, this.props.favoriteBuildings),
			allBuildings: buildings,
		}))
	}

	render() {
		if (this.state.error) {
			return <NoticeView text={`Error: ${this.state.error.message}`} />
		}

		return (
			<Timer
				interval={1000}
				moment={true}
				render={({now}) => (
					<BuildingHoursList
						buildings={this.state.buildings}
						loading={this.state.loading}
						navigation={this.props.navigation}
						now={now}
						onRefresh={this.refresh}
					/>
				)}
				timezone={CENTRAL_TZ}
			/>
		)
	}
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
	return {
		favoriteBuildings: state.buildings ? state.buildings.favorites : [],
	}
}

export const ConnectedBuildingHoursView = connect(mapStateToProps)(
	BuildingHoursView,
)
