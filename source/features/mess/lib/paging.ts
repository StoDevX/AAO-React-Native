import {SourceFetchError} from '@frogpond/data-sources'

/**
 * A WordPress list's address for one page of it. The first page's is left as given, which is the
 * address the paper's other readers, and the UI tests' fixtures, already know it by.
 */
export function pageHref(href: string, page: number): string {
	if (page === 1) return href
	// Appended rather than set through URLSearchParams, which would encode the commas in a
	// `_fields` list.
	return `${href}${href.includes('?') ? '&' : '?'}page=${page}`
}

/** The page after one of `pageSize` items: none after a short page, which is the last, or an empty one. */
export function nextPage(
	lastPage: unknown[],
	lastPageParam: number,
	pageSize: number,
): number | undefined {
	return lastPage.length === 0 || lastPage.length < pageSize ? undefined : lastPageParam + 1
}

/**
 * Reads WordPress's 400 for a page past the last as an empty page, which ends the list. It is asked
 * for when the post count is a multiple of the page size and the last page is full.
 */
export function emptyPastLastPage(page: number): (error: unknown) => never[] {
	return (error) => {
		if (page > 1 && error instanceof SourceFetchError && error.status === 400) return []
		throw error
	}
}
