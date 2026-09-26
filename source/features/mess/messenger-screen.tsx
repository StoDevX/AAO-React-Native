import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {NewsList} from '../news/news-list'
import {OLAF_MESSENGER} from '../news/sources'
import {useNewsFilterStore} from '../news/store'
import type {StoryType} from '../news/types'
import {asStory} from './lib/as-story'
import {filterTree, resolveFilter} from './lib/filter'
import {MessPicker} from './mess-picker'
import {messCategoriesOptions, messListOptions} from './query'
import type {MessStory} from './types'

/// Defined out here so React Query keeps the result between renders.
const selectRows = (stories: MessStory[]): Array<{id: number; row: StoryType}> =>
	stories.map((story) => ({id: story.id, row: asStory(story)}))

/**
 * The Mess's newest stories, or one section's or column's; a story opens in the reader.
 * A chosen section or column is fetched on its own, so its list reaches past the feed.
 */
export function MessengerScreen(): React.ReactNode {
	let router = useRouter()
	let categories = useQuery(messCategoriesOptions)
	let tree = React.useMemo(
		() => (categories.data === undefined ? undefined : filterTree(categories.data)),
		[categories.data],
	)
	let savedName = useNewsFilterStore((state) => state.selectedCategories[OLAF_MESSENGER.id] ?? null)
	let select = useNewsFilterStore((state) => state.select)

	// A name the tree no longer has falls back to the feed. A saved name waits for the tree, so
	// the feed never stands in for the chosen list while the categories load or after they fail.
	let selectedId = resolveFilter(savedName, tree)
	let resolving = selectedId === undefined
	let selectedName = selectedId === null ? null : savedName
	let list = useQuery({
		...messListOptions(selectedId ?? null),
		select: selectRows,
		enabled: !resolving,
	})
	let query = resolving ? categories : list

	// While waiting, `list` is disabled but keyed to the feed, so its data is the cached feed; offline,
	// the categories pause without loading, and the feed would show under the saved name.
	let rows = React.useMemo(() => (resolving ? [] : (list.data ?? [])), [resolving, list.data])
	let entries = React.useMemo(() => rows.map((r) => r.row), [rows])

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
				// The query has already narrowed the list to the chosen section or column.
				selectedCategory={null}
				thumbnail={OLAF_MESSENGER.thumbnail}
			/>
			<MessPicker
				onSelect={(next) => select(OLAF_MESSENGER.id, next)}
				selected={selectedName}
				tree={tree ?? []}
			/>
		</>
	)
}
