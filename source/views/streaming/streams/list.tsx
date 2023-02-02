import React, {useEffect, useMemo, useState} from 'react'

import {StyleSheet, SectionList} from 'react-native'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {
	Filter,
	FilterToolbar,
	isFilterEnabled,
	isListFilter,
} from '@frogpond/filter'
import {StreamRow} from './row'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import {toLaxTitleCase as titleCase} from '@frogpond/titlecase'
import type {StreamType} from './types'
import {useStreams} from './query'

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

function filterStreams<T>(streams: StreamType[], filters: Filter<T>[]) {
	let enabledCategories = filters.filter(isListFilter).flatMap((filter) => {
		return filter.selectedIndices.map((index) => filter.options[index].title)
	})

	if (enabledCategories.length === 0) {
		return streams
	}

	return streams.filter((stream) => enabledCategories.includes(stream.category))
}

export const StreamListView = (): JSX.Element => {
	let {
		data = [],
		error,
		refetch,
		isLoading,
		isRefetching,
		isError,
	} = useStreams()

	let categories = useMemo(() => {
		let allCategories = data.map((stream) => titleCase(stream.category))

		if (allCategories.length === 0) {
			return []
		}

		return [...new Set(allCategories)].sort()
	}, [data])

	let [filters, setFilters] = useState<Filter<StreamType>[]>([])

	useEffect(() => {
		let filterCategories = categories.map((c) => ({title: c}))
		setFilters([
			{
				type: 'list',
				field: 'category',
				title: 'Categories',
				options: filterCategories,
				selectedIndices: filterCategories.map((_category, index) => index),
				mode: 'any',
			},
		])
	}, [data, categories])

	let sections = useMemo(() => {
		return groupStreams(filterStreams(data, filters))
	}, [data, filters])

	const header = <FilterToolbar filters={filters} onChange={setFilters} />

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? (
					<LoadingView />
				) : isError ? (
					<NoticeView
						buttonText="Try Again"
						onPress={refetch}
						text={`A problem occured while loading: ${error}`}
					/>
				) : filters.some(isFilterEnabled) ? (
					<NoticeView text="No streams to show. Try changing the filters." />
				) : (
					<NoticeView text="No streams." />
				)
			}
			ListHeaderComponent={header}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={(item: StreamType) => item.eid}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => <StreamRow stream={item} />}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={sections}
			style={styles.listContainer}
			testID="stream-list"
		/>
	)
}
