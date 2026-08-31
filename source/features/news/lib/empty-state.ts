/**
 * Which "nothing to show" line applies. Extracted from the list so the
 * choice is testable on its own -- it is a real decision with two outcomes,
 * and the only part of the empty state Jest can meaningfully assert.
 */
export function emptyStateProps(hasActiveFilter: boolean): {title: string; description?: string} {
	if (hasActiveFilter) {
		return {title: 'No stories to show.', description: 'Try changing the filters.'}
	}
	return {title: 'No news stories.'}
}
