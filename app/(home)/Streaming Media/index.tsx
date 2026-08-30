import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {FilterToolbar, ListType} from '@frogpond/filter'
import {StreamRow} from '../../../source/features/streaming/streams/row'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import {toLaxTitleCase as titleCase} from '@frogpond/titlecase'
import type {StreamType} from '../../../source/features/streaming/streams/types'
import {streamsOptionsFor} from '../../../source/features/streaming/streams/query'
import {useQuery} from '@tanstack/react-query'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

const groupStreams = (entries: StreamType[]) => {
	let grouped = groupBy(entries, (j) => j.$groupBy)
	return toPairs(grouped).map(([title, data]) => ({title, data}))
}

const groupStreamsByCategoryAndDate = (stream: StreamType) => {
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
}

const getEnabledCategories = <T extends object>(filters: ListType<T>[]) => {
	return filters.flatMap((filter: ListType<T>) => {
		let filterSelections: ListType<T>['spec']['selected'] = filter.spec.selected
		return filterSelections.flatMap((spec) => spec.title)
	})
}

const filterStreams = <T extends object>(streams: StreamType[], filters: ListType<T>[]) => {
	let enabledCategories = getEnabledCategories(filters)

	if (enabledCategories.length === 0) {
		return streams
	}

	return streams.filter((stream) => enabledCategories.includes(stream.category))
}

export default function StreamingPage(): React.ReactNode {
	let {data = [], error, refetch, isLoading, isRefetching, isError} = useQuery(streamsOptionsFor())

	// Only the narrowing the user asked for is state; the categories on offer are
	// read back out of the streams. Rebuilding the whole filter whenever they
	// changed used to hand back an everything-selected filter, discarding what
	// they had picked on any refetch that actually brought new streams.
	let [chosenCategories, setChosenCategories] = React.useState<string[] | null>(null)

	let entries = React.useMemo(() => {
		return data.map((stream) => groupStreamsByCategoryAndDate(stream))
	}, [data])

	let filters = React.useMemo((): ListType<StreamType>[] => {
		let allCategories = data.map((stream) => titleCase(stream.category))

		if (allCategories.length === 0) {
			return []
		}

		let options = [...new Set(allCategories)].sort().map((category) => ({title: category}))

		return [
			{
				type: 'list',
				key: 'category',
				enabled: true,
				spec: {
					title: 'Categories',
					options,
					selected: chosenCategories
						? options.filter((option) => chosenCategories.includes(option.title))
						: options,
					mode: 'OR',
					displayTitle: true,
				},
				apply: {key: 'category'},
			},
		]
	}, [data, chosenCategories])

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	const header = (
		<FilterToolbar
			filters={filters}
			onPopoverDismiss={(newFilter) => {
				// The categories list is the only filter this toolbar carries.
				if (newFilter.type !== 'list') {
					return
				}
				setChosenCategories(newFilter.spec.selected.map((option) => option.title))
			}}
		/>
	)

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? (
					<LoadingView />
				) : filters.some((f) => f.spec.selected.length) ? (
					<NoticeView text="No streams to show. Try changing the filters." />
				) : (
					<NoticeView text="No streams." />
				)
			}
			ListHeaderComponent={header}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item: StreamType) => item.eid}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => <StreamRow stream={item} />}
			renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
			sections={groupStreams(filterStreams(entries, filters))}
			style={styles.listContainer}
			testID="stream-list"
		/>
	)
}
