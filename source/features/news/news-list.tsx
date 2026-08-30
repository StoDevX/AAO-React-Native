import * as React from 'react'
import {FlatList, type ImageResolvedAssetSource, StyleSheet} from 'react-native'
import type {StoryType} from './types'
import * as c from '@frogpond/colors'
import {ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {NewsRow} from './news-row'
import {cleanEntries, trimStoryCateogry} from './lib/util'
import {FilterToolbar, ListType} from '@frogpond/filter'
import {UseQueryResult} from '@tanstack/react-query'

type Props = {
	query: UseQueryResult<StoryType[]>
	thumbnail: false | ImageResolvedAssetSource
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
	return story.categories.map((category) => trimStoryCateogry(category))
}

let filterStories = (entries: StoryType[], filters: ListType<StoryType>[]) => {
	return entries.filter((story) => {
		let enabledCategories = filters.flatMap((f: ListType<StoryType>) =>
			f.spec.selected.flatMap((s) => s.title),
		)

		if (enabledCategories.length === 0) {
			return entries
		}

		return getStoryCategories(story).some((category) => enabledCategories.includes(category))
	})
}

const NewsItemSeparator = (thumbnail: Props['thumbnail']) => (
	<ListSeparator spacing={{left: thumbnail === false ? undefined : 101}} />
)

export const NewsList = (props: Props): React.ReactNode => {
	let {data = [], error, refetch, isRefetching, isError, isLoading} = props.query

	let entries = React.useMemo(() => cleanEntries(data), [data])

	// Only the narrowing the user asked for is state; the categories on offer are
	// read back out of the feed. Rebuilding the whole filter whenever the feed
	// changed used to hand back an everything-selected filter, discarding what
	// they had picked on any refetch that actually brought new stories.
	let [chosenCategories, setChosenCategories] = React.useState<string[] | null>(null)

	let filters = React.useMemo((): ListType<StoryType>[] => {
		let allCategories = entries.flatMap((story) => getStoryCategories(story))

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
				apply: {key: 'categories'},
			},
		]
	}, [entries, chosenCategories])

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
		<FlatList
			ItemSeparatorComponent={NewsItemSeparator}
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
			contentInsetAdjustmentBehavior="automatic"
			data={filterStories(entries, filters)}
			keyExtractor={(item: StoryType) => item.title}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<NewsRow onPress={(url: string) => openUrl(url)} story={item} thumbnail={props.thumbnail} />
			)}
			style={styles.listContainer}
		/>
	)
}
