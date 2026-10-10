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
 * for when the post count is a multiple of the page size and the last page is full. Only that 400
 * ends a list, known by its code: a 400 for a bad parameter, or ccc-server's refusal of one, fails
 * the page, rather than cutting the list short without a word.
 */
export function emptyPastLastPage(page: number): (error: unknown) => never[] {
	return (error) => {
		if (
			page > 1 &&
			error instanceof SourceFetchError &&
			error.status === 400 &&
			error.code === 'rest_post_invalid_page_number'
		) {
			return []
		}
		throw error
	}
}
