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
import {useFetch} from 'react-async'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

const groupStreams = (entries: StreamType[]) => {
	let grouped = groupBy(entries, (j) => j.$groupBy)
	return toPairs(grouped).map(([title, data]) => ({title, data}))
}

const useStreams = (date: Moment = moment.tz(timezone())) => {
	let dateFrom = date.format('YYYY-MM-DD')
	let dateTo = date.clone().add(2, 'month').format('YYYY-MM-DD')

	return useFetch<StreamType[]>(
		API('/streams/upcoming', {
			sort: 'ascending',
			dateFrom,
			dateTo,
		}),
		{
			headers: {accept: 'application/json'},
		},
	)
}

export const StreamListView = (): JSX.Element => {
	let {data = [], error, reload, isPending, isInitial, isLoading} = useStreams()

	let entries = React.useMemo(() => {
		return data
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
	}, [data])

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text={`A problem occured while loading the streams. ${error.message}`}
			/>
		)
	}

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="No streams." />
			}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={(item: StreamType) => item.eid}
			onRefresh={reload}
			refreshing={isPending && !isInitial}
			renderItem={({item}) => <StreamRow stream={item} />}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={groupStreams(entries)}
			style={styles.listContainer}
		/>
	)
}
