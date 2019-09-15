// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {timezone} from '@frogpond/constants'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {StreamRow} from './row'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import {toLaxTitleCase as titleCase} from '@frogpond/titlecase'
import type {StreamType} from './types'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

type Props = {}

type State = {
	error: ?string,
	loading: boolean,
	refreshing: boolean,
	streams: Array<{title: string, data: Array<StreamType>}>,
}

export class StreamListView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Streaming',
		tabBarIcon: TabBarIcon('recording'),
	}

	state = {
		error: null,
		loading: true,
		refreshing: false,
		streams: [],
	}

	componentDidMount() {
		this.getStreams().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	refresh = async (): any => {
		this.setState(() => ({refreshing: true}))
		await this.getStreams(true)
		this.setState(() => ({refreshing: false}))
	}

	getStreams = async (
		reload?: boolean,
		date: moment = moment.tz(timezone()),
	) => {
		let dateFrom = date.format('YYYY-MM-DD')
		let dateTo = date
			.clone()
			.add(2, 'month')
			.format('YYYY-MM-DD')

		let data = await fetch(API('/streams/upcoming'), {
			searchParams: {
				sort: 'ascending',
				dateFrom,
				dateTo,
			},
			delay: reload ? 500 : 0,
		}).json()

		data = data
			.filter(stream => stream.category !== 'athletics')
			.map(stream => {
				let date = moment(stream.starttime)
				let group =
					stream.status.toLowerCase() !== 'live'
						? date.format('dddd, MMMM Do')
						: 'Live'

				return {
					...stream,
					// force title-case on the stream types, to prevent not-actually-duplicate headings
					category: titleCase(stream.category),
					date: date,
					$groupBy: group,
				}
			})

		let grouped = groupBy(data, j => j.$groupBy)
		let mapped = toPairs(grouped).map(([title, data]) => ({title, data}))

		this.setState(() => ({streams: mapped}))
	}

	keyExtractor = (item: StreamType) => item.eid

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	renderItem = ({item}: {item: StreamType}) => <StreamRow stream={item} />

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		if (this.state.error) {
			return <NoticeView text={`Error: ${this.state.error}`} />
		}

		return (
			<SectionList
				testID="stream-list"
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<NoticeView text="No Streams" />}
				contentContainerStyle={styles.contentContainer}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={(this.state.streams: any)}
				style={styles.listContainer}
			/>
		)
	}
}
