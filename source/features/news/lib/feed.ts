import type {StoryType} from '../types'
import {cleanEntries, extractCategories} from './util'

/** The parts of a news query the screen reads. */
export type NewsFeedQuery = {
	isLoading: boolean
	isError: boolean
	error?: unknown
	refetch: () => Promise<unknown>
}

export type NewsFeed = {
	/** Cleaned stories */
	entries: StoryType[]
	/** The categories those stories carry */
	categories: string[]
}

/**
 * Clean a feed once, and take both the list and the picker's categories from
 * that one pass, rather than each scanning the same post bodies again.
 */
export function summarizeFeed(stories: StoryType[]): NewsFeed {
	let entries = cleanEntries(stories)
	return {entries, categories: extractCategories(entries)}
}
