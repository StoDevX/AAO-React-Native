import * as React from 'react'
import {FlatList, StyleSheet} from 'react-native'
import type {StoryType} from './types'
import {API} from '@frogpond/api'
import * as c from '@frogpond/colors'
import {useFetch} from 'react-async'
import {ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {NewsRow} from './news-row'
import {cleanEntries, trimStoryCateogry} from './lib/util'
import {FilterToolbar, ListType} from '@frogpond/filter'
import memoize from 'lodash/memoize'

type Props = {
	source: string | {url: string; type: 'rss' | 'wp-json'}
	thumbnail: false | number
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

const useNews = (source: Props['source']) => {
	let url
	if (typeof source === 'string') {
		url = API(`/news/named/${source}`)
	} else if (source.type === 'rss') {
		url = API('/news/rss', {url: source.url})
	} else if (source.type === 'wp-json') {
		url = API('/news/wpjson', {url: source.url})
	} else {
		throw new Error('invalid news source type!')
	}

	return useFetch<StoryType[]>(url, {
		headers: {accept: 'application/json'},
	})
}

let getStoryCategories = (story: StoryType) => {
	return story.categories.map((c) => trimStoryCateogry(c))
}

let filterStories = (entries: StoryType[], filters: ListType[]) => {
	return entries.filter((story) => {
		let enabledCategories = filters.flatMap((f: ListType) =>
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

let memoizedFilterStories = memoize(filterStories)
memoizedFilterStories.cache = new WeakMap()

export const NewsList = (props: Props): JSX.Element => {
	let {
		data = [],
		error,
		reload,
		isPending,
		isInitial,
		isLoading,
	} = useNews(props.source)

	let entries = React.useMemo(() => cleanEntries(data), [data])

	let [filters, setFilters] = React.useState<ListType[]>([])

	React.useEffect(() => {
		let allCategories = entries.flatMap((story) => getStoryCategories(story))

		if (allCategories.length === 0) {
			return
		}

		let categories = [...new Set(allCategories)].sort()
		let filterCategories = categories.map((c) => {
			return {title: c}
		})

		let newsFilters: ListType[] = [
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
				apply: {key: 'category'},
			},
		]
		setFilters(newsFilters)
	}, [entries])

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text="A problem occured while loading the news stories"
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
				setFilters(edited as ListType[])
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
				) : filters.some((f: ListType) => f.spec.selected.length) ? (
					<NoticeView text="No stories to show. Try changing the filters." />
				) : (
					<NoticeView text="No news stories." />
				)
			}
			ListHeaderComponent={header}
			contentContainerStyle={styles.contentContainer}
			data={memoizedFilterStories(entries, filters)}
			keyExtractor={(item: StoryType) => item.title}
			onRefresh={reload}
			refreshing={isPending && !isInitial}
			renderItem={({item}: {item: StoryType}) => (
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
