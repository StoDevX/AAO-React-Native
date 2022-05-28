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

export const NewsList = (props: Props): JSX.Element => {
	let {
		data = [],
		error,
		reload,
		isPending,
		isInitial,
		isLoading,
	} = useNews(props.source)

	// remove all entries with blank excerpts
	// remove all entries with a <form from the list
	let entries = data
		.filter((entry) => entry.excerpt.trim() !== '')
		.filter((entry) => !entry.content.includes('<form'))

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text="A problem occured while loading the news stories"
			/>
		)
	}

	return (
		<FlatList
			ItemSeparatorComponent={() => (
				<ListSeparator
					spacing={{left: props.thumbnail === false ? undefined : 101}}
				/>
			)}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="No news." />
			}
			contentContainerStyle={styles.contentContainer}
			data={entries}
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
