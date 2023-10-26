import * as React from 'react'
import {FlatList, StyleSheet} from 'react-native'

import * as c from '@frogpond/colors'
import {FilterToolbar, ListType} from '@frogpond/filter'
import {ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'

import {cleanEntries, trimStoryCateogry} from './lib/util'
import {NewsRow} from './news-row'
import type {StoryType} from './types'
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

let getStoryCategories = (story: StoryType) => {
	return story.categories.map((c) => trimStoryCateogry(c))
}

let filterStories = (entries: StoryType[], filters: ListType<StoryType>[]) => {
	return entries.filter((story) => {
		let enabledCategories = filters.flatMap((f: ListType<StoryType>) =>
			f.spec.selected.flatMap((s) => s.title),
		)

		if (enabledCategories.length === 0) {
			return entries
		}

		return getStoryCategories(story).some((category) =>
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

	let entries = React.useMemo(() => cleanEntries(data), [data])

	let [filters, setFilters] = React.useState<ListType<StoryType>[]>([])

	React.useEffect(() => {
		let allCategories = entries.flatMap((story) => getStoryCategories(story))

		if (allCategories.length === 0) {
			return
		}

		let categories = [...new Set(allCategories)].sort()
		let filterCategories = categories.map((c) => {
			return {title: c}
		})

		let newsFilters: ListType<StoryType>[] = [
			{
				type: 'list',
				key: 'category',
				enabled: true,
				spec: {
					title: 'Categories',
					options: filterCategories,
					selected: filterCategories,
					mode: 'OR',
					displayTitle: true,
				},
				apply: {key: 'categories'},
			},
		]
		setFilters(newsFilters)
	}, [entries])

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
				let edited = filters.map((f) =>
					f.key === newFilter.key ? newFilter : f,
				)
				setFilters(edited as ListType<StoryType>[])
			}}
		/>
	)

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
				) : filters.some((f) => f.spec.selected.length) ? (
					<NoticeView text="No stories to show. Try changing the filters." />
				) : (
					<NoticeView text="No news stories." />
				)
			}
			ListHeaderComponent={header}
			contentContainerStyle={styles.contentContainer}
			data={filterStories(entries, filters)}
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
