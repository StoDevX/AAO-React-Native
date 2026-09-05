import * as React from 'react'
import {Stack} from 'expo-router'
import {useQueries} from '@tanstack/react-query'

import {extractCategories, NewsList} from '../../source/features/news/news-list'
import {NewsPicker} from '../../source/features/news/news-picker'
import {namedNewsOptions} from '../../source/features/news/query'
import {NEWS_SOURCES} from '../../source/features/news/sources'
import {useNewsFilterStore} from '../../source/features/news/store'

export default function NewsPage(): React.ReactNode {
	let {selectedSource, selectedCategory, select} = useNewsFilterStore()
	let source = NEWS_SOURCES.find((s) => s.id === selectedSource) ?? NEWS_SOURCES[0]

	// Fetch all sources to populate the picker with categories
	let queries = useQueries({
		queries: NEWS_SOURCES.map((s) => namedNewsOptions(s.id)),
	})

	// The query for the currently selected source
	let currentQueryIndex = NEWS_SOURCES.findIndex((s) => s.id === selectedSource)
	let currentQuery = queries[currentQueryIndex >= 0 ? currentQueryIndex : 0]

	// Build categories by source from fetched data
	// Destructure data arrays to satisfy @tanstack/query(no-unstable-deps)
	let dataArrays = queries.map((q) => q.data)
	let categoriesBySource = React.useMemo(() => {
		let result: Record<string, string[]> = {}
		NEWS_SOURCES.forEach((s, i) => {
			let data = dataArrays[i] ?? []
			result[s.id] = extractCategories(data)
		})
		return result
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, dataArrays)

	return (
		<>
			<Stack.Screen options={{title: source.title}} />
			<NewsList
				query={currentQuery}
				selectedCategory={selectedCategory}
				thumbnail={source.thumbnail}
			/>
			<NewsPicker
				categoriesBySource={categoriesBySource}
				onSelect={select}
				selectedCategory={selectedCategory}
				selectedSource={selectedSource}
				sources={NEWS_SOURCES}
			/>
		</>
	)
}
