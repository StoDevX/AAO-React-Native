// @flow

import * as React from 'react'
import {NoticeView} from '@frogpond/notice'
import {BuildingHoursList} from './list'
import {type ReduxState} from '../../redux'
import {connect} from 'react-redux'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import {timezone} from '@frogpond/constants'
import {Timer} from '@frogpond/timer'

import {fetchAndCacheItem, type CacheResult} from '../../lib/cache'
import {API} from '@frogpond/api'

function fetchBuildingHours(
	args: {reload?: boolean} = {},
): CacheResult<?Array<BuildingType>> {
	return fetchAndCacheItem({
		key: 'spaces:hours',
		url: API('/spaces/hours'),
		afterFetch: parsed => parsed.data,
		ttl: [1, 'hour'],
		cbForBundledData: () =>
			Promise.resolve(require('../../../docs/building-hours.json')),
		force: args.reload,
		delay: args.reload,
	})
}

const groupBuildings = (
	buildings: Array<BuildingType>,
	favorites: Array<string>,
): Array<{title: string, data: Array<BuildingType>}> => {
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

type State = {|
	error: ?Error,
	loading: boolean,
	buildings: Array<BuildingType>,
|}

export class BuildingHoursView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Building Hours',
		headerBackTitle: 'Hours',
	}

	state = {
		error: null,
		loading: false,
		buildings: [],
	}

	componentDidMount() {
		this.fetchData()
	}

	refresh = async (): any => {
		this.setState(() => ({loading: true}))
		await this.fetchData(true)
		this.setState(() => ({loading: false}))
	}

	fetchData = async (reload?: boolean) => {
		let {value} = await fetchBuildingHours({reload})
		this.setState(() => ({buildings: value || []}))
	}

	render() {
		if (this.state.error) {
			return <NoticeView text={`Error: ${this.state.error.message}`} />
		}

		let {buildings} = this.state
		let {favoriteBuildings} = this.props
		let grouped = groupBuildings(buildings, favoriteBuildings)

		return (
			<Timer
				interval={60000}
				moment={true}
				render={({now}) => (
					<BuildingHoursList
						buildings={grouped}
						loading={this.state.loading}
						navigation={this.props.navigation}
						now={now}
						onRefresh={this.refresh}
					/>
				)}
				timezone={timezone()}
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
