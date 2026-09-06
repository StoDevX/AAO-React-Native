import type {StoryType} from '../types'
import {cleanEntries, extractCategories} from './util'

/** The parts of a news query the screen reads. */
export type NewsFeedQuery = {
	data?: StoryType[]
	isLoading: boolean
	isError: boolean
	error?: unknown
	refetch: () => Promise<unknown>
}

export type NewsFeeds = {
	/** Cleaned stories, keyed by source id */
	entriesBySource: Record<string, StoryType[]>
	/** Categories offered by each source, keyed by source id */
	categoriesBySource: Record<string, string[]>
	/** The query behind each source, keyed by source id */
	queryBySource: Record<string, NewsFeedQuery>
	/** Ids of the sources whose fetch failed */
	unavailableSources: string[]
}

/**
 * Fold every source's query into the shape the screen needs. Cleaning happens
 * once here and both the list and the picker's categories come out of that one
 * pass, rather than each scanning the same post bodies again.
 */
export function combineNewsResults(
	sourceIds: string[],
	results: readonly NewsFeedQuery[],
): NewsFeeds {
	let entriesBySource: Record<string, StoryType[]> = {}
	let categoriesBySource: Record<string, string[]> = {}
	let queryBySource: Record<string, NewsFeedQuery> = {}
	let unavailableSources: string[] = []

	sourceIds.forEach((id, index) => {
		let query = results[index]
		if (!query) return

		let entries = cleanEntries(query.data ?? [])
		entriesBySource[id] = entries
		categoriesBySource[id] = extractCategories(entries)
		queryBySource[id] = query
		if (query.isError) unavailableSources.push(id)
	})

	return {entriesBySource, categoriesBySource, queryBySource, unavailableSources}
}
