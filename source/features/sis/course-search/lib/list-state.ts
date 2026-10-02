import {listState, type ListState} from '@frogpond/notice'
import {onlineManager} from '@tanstack/react-query'

/** What course search says when it has no catalog and no connection to fetch one. */
export const COURSE_OFFLINE_NOTICE =
	'Course search needs a connection to download the course catalog the first time.'

/** Which state course search draws, from the catalog refresh and the results read. */
export function courseListState(
	catalog: {isError: boolean; isPending: boolean; isPaused: boolean},
	results: {hasCatalog: boolean; isPending: boolean; failed: boolean},
): ListState {
	return listState({
		hasData: results.hasCatalog,
		isError: catalog.isError || results.failed,
		isPending: catalog.isPending || results.isPending,
		isPaused: catalog.isPaused,
		isOnline: onlineManager.isOnline(),
	})
}

/** What the course detail screen shows. */
export type CourseDetailState =
	| 'course'
	| 'read-error'
	| 'loading'
	| 'offline'
	| 'catalog-error'
	| 'not-found'

/**
 * Which state the course detail screen draws, from its course read
 * (`undefined` while reading, `null` when the catalog has no such course) and
 * the catalog refresh. A stored course always wins; without one, the screen
 * waits only while a download can actually finish.
 */
export function courseDetailState(
	course: object | null | undefined,
	failed: boolean,
	catalog: {isError: boolean; isPending: boolean; isPaused: boolean},
): CourseDetailState {
	if (course) return 'course'
	if (failed) return 'read-error'
	if (course === undefined) return 'loading'
	if (catalog.isPaused && !onlineManager.isOnline()) return 'offline'
	if (catalog.isPending) return 'loading'
	if (catalog.isError) return 'catalog-error'
	return 'not-found'
}
