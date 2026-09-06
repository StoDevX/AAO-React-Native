import * as React from 'react'
import {Stack} from 'expo-router'
import {useQueries} from '@tanstack/react-query'

import {NewsList} from '../../source/features/news/news-list'
import {NewsPicker} from '../../source/features/news/news-picker'
import {
	combineNewsResults,
	type NewsFeedQuery,
	type NewsFeeds,
} from '../../source/features/news/lib/combine'
import {resolveCategory} from '../../source/features/news/lib/util'
import {namedNewsOptions} from '../../source/features/news/query'
import {NEWS_SOURCES} from '../../source/features/news/sources'
import {useNewsFilterStore} from '../../source/features/news/store'

const NEWS_SOURCE_IDS = NEWS_SOURCES.map((s) => s.id)

// Defined out here so react-query can memoize the fold; a combine rebuilt on
// every render is re-run on every render.
const combineNewsFeeds = (results: NewsFeedQuery[]): NewsFeeds =>
	combineNewsResults(NEWS_SOURCE_IDS, results)

export default function NewsPage(): React.ReactNode {
	let {selectedSource, selectedCategory, select} = useNewsFilterStore()
	let source = NEWS_SOURCES.find((s) => s.id === selectedSource) ?? NEWS_SOURCES[0]

	// Every source is fetched, not only the one on screen: the picker lists the
	// categories each source offers, and the Menu has no "opened" callback to
	// defer the others to. The cost is one extra feed per cold open.
	let {entriesBySource, categoriesBySource, queryBySource, unavailableSources} = useQueries({
		queries: NEWS_SOURCES.map((s) => namedNewsOptions(s.id)),
		combine: combineNewsFeeds,
	})

	let categories = categoriesBySource[source.id] ?? []
	let category = resolveCategory(selectedCategory, categories)

	return (
		<>
			<Stack.Screen options={{title: source.title}} />
			<NewsList
				entries={entriesBySource[source.id] ?? []}
				query={queryBySource[source.id]}
				selectedCategory={category}
				thumbnail={source.thumbnail}
			/>
			<NewsPicker
				categoriesBySource={categoriesBySource}
				onSelect={select}
				selectedCategory={category}
				selectedSource={source.id}
				sources={NEWS_SOURCES}
				unavailableSources={unavailableSources}
			/>
		</>
	)
}
