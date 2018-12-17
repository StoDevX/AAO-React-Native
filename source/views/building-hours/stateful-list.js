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
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'

const getBundledData = () =>
	Promise.resolve(require('../../../docs/building-hours.json'))
const fetchHours = (forReload?: boolean): Promise<Array<BuildingType>> =>
	fetch(API('/spaces/hours'), {
		delay: forReload ? 500 : 0,
	})
		.json()
		.then(body => body.data)

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
		let buildings = await fetchHours(true)
		this.setState(() => ({loading: false, buildings}))
	}

	fetchData = async () => {
		let buildings = await fetchHours()
		this.setState(() => ({buildings}))
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
