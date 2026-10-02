import * as React from 'react'
import {Stack} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {NewsList} from './news-list'
import {NewsPicker} from './news-picker'
import {summarizeFeed} from './lib/feed'
import {resolveCategory} from './lib/util'
import {namedNewsOptions} from './query'
import type {NewsSource} from './sources'
import {useNewsFilterStore} from './store'

type Props = {
	source: NewsSource
}

/** One feed's stories, filtered by the category chosen for that feed. */
export function NewsScreen({source}: Props): React.ReactNode {
	let query = useQuery({...namedNewsOptions(source.id), select: summarizeFeed})
	let savedCategory = useNewsFilterStore((state) => state.selectedCategories[source.id] ?? null)
	let select = useNewsFilterStore((state) => state.select)

	let categories = query.data?.categories ?? []
	let category = resolveCategory(savedCategory, categories)

	return (
		<>
			<Stack.Screen options={{title: source.title}} />
			<NewsList
				entries={query.data?.entries ?? []}
				query={query}
				selectedCategory={category}
				thumbnail={source.thumbnail}
			/>
			<NewsPicker
				categories={categories}
				onSelect={(next) => select(source.id, next)}
				selectedCategory={category}
			/>
		</>
	)
}
