import * as React from 'react'
import {useQuery} from '@tanstack/react-query'
import {MissingMessStoryError, messFeedOptions, messStoryOptions} from './query'
import type {MessStory} from './types'

/** What a screen needs to draw a story, or its loading, failure or unavailable state. */
export type MessStoryLookup = {
	/** Undefined while loading, after a failure, or when there is no such story */
	data: MessStory | undefined
	isPending: boolean
	/** Whether loading failed, so that trying again might help */
	isLoadingError: boolean
	error: Error | null
	refetch: () => unknown
}

/**
 * A Mess story by its post id: from the cached feed when it is there, since the feed is
 * already loaded, and otherwise fetched on its own, as a series thumbnail's story may be.
 */
export function useMessStory(id: number): MessStoryLookup {
	// A stable selector, so the story is found again only when the feed or the id changes.
	let selectStory = React.useCallback(
		(stories: MessStory[]) => stories.find((s) => s.id === id),
		[id],
	)
	let feed = useQuery({...messFeedOptions, select: selectStory})
	// Whether the feed holds stories at all: a failed refetch keeps them, and their time, but turns
	// `isSuccess` false. An id that is not a number names no post, so there is nothing to fetch.
	let outsideFeed = feed.dataUpdatedAt > 0 && feed.data === undefined && Number.isInteger(id)
	let single = useQuery({...messStoryOptions(id), enabled: outsideFeed})

	if (!outsideFeed) return feed
	// A post that parses to no story is unavailable, which trying again will not change.
	if (single.error instanceof MissingMessStoryError) {
		return {
			data: undefined,
			isPending: false,
			isLoadingError: false,
			error: single.error,
			refetch: single.refetch,
		}
	}
	return single
}
