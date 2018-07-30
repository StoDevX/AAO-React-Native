// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import moment from 'moment'
import {type TopLevelViewPropsType} from '../types'
import {NoticeView} from '../components/notice'
import {trackBuildingOpen} from '../../analytics'
import * as c from '../components/colors'
import {ListSeparator, ListSectionHeader} from '../components/list'

import {aaoGh, fromRedux} from '@app/fetch'
import {DataFetcher} from '@frogpond/data-fetcher'
import {age} from '@frogpond/age'
import {Timer} from '@frogpond/timer'

import {type BuildingType} from './types'
import {memGroupBuildings} from './lib/group-buildings'
import {BuildingRow} from './row'

let buildingHours = aaoGh({
	file: 'building-hours.json',
	version: 2,
	cacheControl: {
		maxAge: age.days(1),
		staleWhileRevalidate: true,
		staleIfOffline: true,
	},
})

let reduxFavoriteBuildings = fromRedux({
	key: ['buildings', 'favorites'],
	default: [],
})

type DataFetcherProps = {
	buildingHours: {
		data: Array<BuildingType>,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
	reduxFavoriteBuildings: {
		data: Array<string>,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
})

type Props = TopLevelViewPropsType

export class BuildingHoursView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Building Hours',
		headerBackTitle: 'Hours',
	}

	onPressRow = (data: BuildingType) => {
		trackBuildingOpen(data.name)
		this.props.navigation.navigate('BuildingHoursDetailView', {building: data})
	}

	keyExtractor = (item: BuildingType) => item.name

	renderSectionHeader = ({section: {title}}: any) => {
		return <ListSectionHeader title={title} />
	}

	renderItem = ({item}: {item: BuildingType}) => {
		return (
			<Timer
				interval={age.minute(1)}
				render={ts => (
					<BuildingRow
						info={item}
						name={item.name}
						now={moment(ts)}
						onPress={this.onPressRow}
					/>
				)}
			/>
		)
	}

	renderList = (args: DataFetcherProps) => {
		let {
			buildingHours: {data: buildings, loading, refresh},
			reduxFavoriteBuildings: {data: favoriteBuildings},
		} = args

		let groupedBuildings = memGroupBuildings(buildings, favoriteBuildings)

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				contentContainerStyle={styles.container}
				keyExtractor={this.keyExtractor}
				onRefresh={refresh}
				refreshing={loading}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={groupedBuildings}
			/>
		)
	}

	render() {
		return (
			<DataFetcher
				error={NoticeView}
				render={this.renderList}
				resources={{buildingHours, reduxFavoriteBuildings}}
			/>
		)
	}
}
