import type {DirectorySearchTypeEnum} from './types'

type ResolveSearchArgs = {
	/** The department the screen was opened for, if it was opened for one. */
	departmentLink: string | undefined
	/** Whatever is in the search field. */
	typedQuery: string
}

/**
 * The search a Directory screen should be running.
 *
 * A screen opened from a department link keeps that department as its
 * baseline: it is what the list shows before anyone types, and what an emptied
 * field falls back to. The search bar's cancel button reports itself by
 * emptying the field, so this is what puts the department results back.
 */
export function resolveSearch({departmentLink, typedQuery}: ResolveSearchArgs): {
	query: string
	type: DirectorySearchTypeEnum
} {
	if (typedQuery) {
		return {query: typedQuery, type: 'query'}
	}

	if (departmentLink) {
		return {query: departmentLink, type: 'department'}
	}

	return {query: '', type: 'query'}
}

/**
 * The name a search shows above its results, or null when there is nothing to
 * name. A search the reader typed answers only for itself; every other kind was
 * opened from something named, and the results mean little without saying what.
 */
export function searchHeading(search: {
	query: string
	type: DirectorySearchTypeEnum
}): string | null {
	return search.type === 'query' ? null : search.query
}
