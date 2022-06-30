import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {timezone} from '@frogpond/constants'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {StreamRow} from './row'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
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

export const StreamListView = (): JSX.Element => {
	let [error, setError] = React.useState<Error | null>(null)
	let [loading, setLoading] = React.useState(true)
	let [refreshing, setRefreshing] = React.useState(false)
	let [streams, setStreams] = React.useState<
		Array<{title: string; data: StreamType[]}>
	>([])

	React.useEffect(() => {
		try {
			getStreams().then(() => {
				setLoading(false)
			})
		} catch (error) {
			if (error instanceof Error) {
				setError(error)
			} else {
				setError(new Error('unknown error - not an Error'))
			}
			return
		}
	}, [])

	let refresh = async (): Promise<void> => {
		setRefreshing(true)
		await getStreams(true)
		setRefreshing(false)
	}

	let getStreams = async (
		reload?: boolean,
		date: Moment = moment.tz(timezone()),
	) => {
		let dateFrom = date.format('YYYY-MM-DD')
		let dateTo = date.clone().add(2, 'month').format('YYYY-MM-DD')

		let data = await fetch(API('/streams/upcoming'), {
			searchParams: {
				sort: 'ascending',
				dateFrom,
				dateTo,
			},
			delay: reload ? 500 : 0,
		}).json<Array<StreamType>>()

		data = data
			.filter((stream) => stream.category !== 'athletics')
			.map((stream) => {
				let date: Moment = moment(stream.starttime)
				let dateGroup = date.format('dddd, MMMM Do')

				let group = stream.status.toLowerCase() !== 'live' ? dateGroup : 'Live'

				return {
					...stream,
					// force title-case on the stream types, to prevent not-actually-duplicate headings
					category: titleCase(stream.category),
					date: date,
					$groupBy: group,
				}
			})

		let grouped = groupBy(data, (j) => j.$groupBy)
		let mapped = toPairs(grouped).map(([title, data]) => ({title, data}))

		setStreams(mapped)
	}

	let keyExtractor = (item: StreamType) => item.eid

	let renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	let renderItem = ({item}: {item: StreamType}) => <StreamRow stream={item} />

	if (loading) {
		return <LoadingView />
	}

	if (error) {
		return <NoticeView text={`Error: ${error.message}`} />
	}

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="No Streams" />}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={keyExtractor}
			onRefresh={refresh}
			refreshing={refreshing}
			renderItem={renderItem}
			renderSectionHeader={renderSectionHeader}
			sections={streams}
			style={styles.listContainer}
		/>
	)
}
