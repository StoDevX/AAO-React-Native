import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {NewsList} from '../news/news-list'
import {NewsPicker} from '../news/news-picker'
import {extractCategories, resolveCategory} from '../news/lib/util'
import {OLAF_MESSENGER} from '../news/sources'
import {useNewsFilterStore} from '../news/store'
import type {StoryType} from '../news/types'
import {asStory} from './lib/as-story'
import {messFeedOptions} from './query'
import type {MessStory} from './types'

/// Defined out here so React Query keeps the result between renders.
const selectRows = (stories: MessStory[]): Array<{id: number; row: StoryType}> =>
	stories.map((story) => ({id: story.id, row: asStory(story)}))

/** The Mess's newest stories, filtered by section; a story opens in the reader. */
export function MessengerScreen(): React.ReactNode {
	let router = useRouter()
	let query = useQuery({...messFeedOptions, select: selectRows})
	let savedCategory = useNewsFilterStore(
		(state) => state.selectedCategories[OLAF_MESSENGER.id] ?? null,
	)
	let select = useNewsFilterStore((state) => state.select)

	let rows = React.useMemo(() => query.data ?? [], [query.data])
	let entries = React.useMemo(() => rows.map((r) => r.row), [rows])
	let categories = React.useMemo(() => extractCategories(entries), [entries])
	let category = resolveCategory(savedCategory, categories)

	let openStory = (story: StoryType) => {
		let id = rows.find((r) => r.row === story)?.id
		if (id === undefined) return
		router.navigate({pathname: '/Messenger/story', params: {id: String(id)}})
	}

	return (
		<>
			<Stack.Screen options={{title: OLAF_MESSENGER.title}} />
			<NewsList
				entries={entries}
				onPressStory={openStory}
				query={query}
				selectedCategory={category}
				thumbnail={OLAF_MESSENGER.thumbnail}
			/>
			<NewsPicker
				categories={categories}
				onSelect={(next) => select(OLAF_MESSENGER.id, next)}
				selectedCategory={category}
			/>
		</>
	)
}
