import React, {useEffect, useState, useMemo} from 'react'
import {FlatList, StyleSheet} from 'react-native'
import type {StoryType} from './types'
import * as c from '@frogpond/colors'
import {ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {NewsRow} from './news-row'
import {
	Filter,
	FilterToolbar,
	isFilterEnabled,
	isListFilter,
	ListFilter,
} from '@frogpond/filter'
import {UseQueryResult} from '@tanstack/react-query'

type Props = {
	query: UseQueryResult<StoryType[]>
	thumbnail: false | number
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

let filterStories = (entries: StoryType[], filters: Filter<StoryType>[]) => {
	return entries.filter((story) => {
		let enabledCategories = filters
			.filter(isListFilter)
			.flatMap((f) =>
				f.selectedIndices.flatMap((index) => f.options[index].title),
			)

		if (enabledCategories.length === 0) {
			return entries
		}

		return story.categories.some((category) =>
			enabledCategories.includes(category),
		)
	})
}

export const NewsList = (props: Props): JSX.Element => {
	let {
		data = [],
		error,
		refetch,
		isRefetching,
		isError,
		isLoading,
	} = props.query

	let categories = useMemo(() => {
		let allCategories = data.flatMap((story) => story.categories)

		if (allCategories.length === 0) {
			return []
		}

		return [...new Set(allCategories)].sort()
	}, [data])

	let [filters, setFilters] = useState<Filter<StoryType>[]>([])

	useEffect(() => {
		let filterCategories = categories.map((c) => ({title: c}))
		setFilters([
			{
				type: 'list',
				field: 'categories',
				title: 'Categories',
				options: filterCategories,
				selectedIndices: filterCategories.map((_category, index) => index),
				mode: 'any',
			},
		])
	}, [data, categories])

	let sections = useMemo(() => {
		return filterStories(data, filters)
	}, [data, filters])

	const header = <FilterToolbar filters={filters} onChange={setFilters} />

	return (
		<FlatList
			ItemSeparatorComponent={() => (
				<ListSeparator
					spacing={{left: props.thumbnail === false ? undefined : 101}}
				/>
			)}
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
					<NoticeView text="No stories to show. Try changing the filters." />
				) : (
					<NoticeView text="No news stories." />
				)
			}
			ListHeaderComponent={header}
			contentContainerStyle={styles.contentContainer}
			data={sections}
			keyExtractor={(item: StoryType) => item.title}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<NewsRow
					onPress={(url: string) => openUrl(url)}
					story={item}
					thumbnail={props.thumbnail}
				/>
			)}
			style={styles.listContainer}
		/>
	)
}
