// @flow

import * as React from 'react'
import {NoticeView} from '../components/notice'
import {BuildingHoursList} from './list'
import {type ReduxState} from '../../flux'
import {connect} from 'react-redux'
import moment from 'moment-timezone'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType, BreakCollection} from './types'
import * as bundledHours from '../../../docs/building-hours.json'
import * as bundledBreaks from '../../../docs/breaks.json'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import delay from 'delay'
import {CENTRAL_TZ} from './lib'
import {GH_PAGES_URL} from '../../globals'

function promoteBreakSchedules(
	buildings: Array<BuildingType>,
	breaks: BreakCollection,
) {
	const thisBreakName = ''

	for (let building of buildings) {

	}
}

const buildingHoursUrl = GH_PAGES_URL('building-hours.json')
const fetchBuildingHours = (): {data: Array<BuildingType>} =>
	fetchJson(buildingHoursUrl).catch(err => {
		reportNetworkProblem(err)
		return bundledHours
	})

const breakDatesUrl = GH_PAGES_URL('breaks.json')
const fetchBreakDates = (): {data: BreakCollection} =>
	fetchJson(breakDatesUrl).catch(err => {
		reportNetworkProblem(err)
		return bundledBreaks
	})

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
	now: moment,
	buildings: Array<{title: string, data: Array<BuildingType>}>,
	allBuildings: Array<BuildingType>,
	intervalId: number,
}

export class BuildingHoursView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Building Hours',
		headerBackTitle: 'Hours',
	}

	state = {
		error: null,
		loading: false,
		// now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
		now: moment.tz(CENTRAL_TZ),
		buildings: groupBuildings(bundledHours.data, this.props.favoriteBuildings),
		allBuildings: bundledHours.data,
		intervalId: 0,
	}

	componentWillMount() {
		this.fetchData()

		// This updates the screen every second, so that the building
		// info statuses are updated without needing to leave and come back.
		this.setState({intervalId: setInterval(this.updateTime, 1000)})
	}

	componentWillReceiveProps(nextProps: Props) {
		this.setState(state => ({
			buildings: groupBuildings(
				state.allBuildings,
				nextProps.favoriteBuildings,
			),
		}))
	}

	componentWillUnmount() {
		clearTimeout(this.state.intervalId)
	}

	updateTime = () => {
		this.setState(() => ({now: moment.tz(CENTRAL_TZ)}))
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
		let [{data: buildings}, {data: breaks}] = await Promise.all([
			fetchBuildingHours(),
			fetchBreakDates(),
		])

		if (process.env.NODE_ENV === 'development') {
			buildings = bundledHours.data
			breaks = bundledBreaks.data
		}

		buildings = promoteBreakSchedules(buildings, breaks)

		this.setState(() => ({
			buildings: groupBuildings(buildings, this.props.favoriteBuildings),
			allBuildings: buildings,
			now: moment.tz(CENTRAL_TZ),
		}))
	}

	render() {
		if (this.state.error) {
			return <NoticeView text={`Error: ${this.state.error.message}`} />
		}

		return (
			<BuildingHoursList
				buildings={this.state.buildings}
				loading={this.state.loading}
				navigation={this.props.navigation}
				now={this.state.now}
				onRefresh={this.refresh}
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
