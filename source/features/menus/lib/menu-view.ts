/** The parts of a React Query result that decide what a menu screen draws. */
export type MenuQueryState<T> = {
	data: T | undefined
	error: Error | null
	isPending: boolean
	isPaused: boolean
}

/**
 * What a menu screen draws for one query.
 *
 * - `content`: there is a menu to show, fresh or cached.
 * - `loading`: nothing to show yet, and a fetch is on its way.
 * - `offline`: nothing to show, and the fetch is waiting for the network.
 * - `error`: nothing to show, and the fetch failed.
 */
export type MenuView<T> =
	| {kind: 'content'; data: T}
	| {kind: 'loading'}
	| {kind: 'offline'}
	| {kind: 'error'; error: Error}

/**
 * Decides what a menu screen draws for one query.
 *
 * Data wins over everything else. A refetch that fails keeps the data it had,
 * so a failed pull-to-refresh or a captive portal answering with HTML leaves
 * the cached menu on screen rather than an error in its place.
 *
 * Pending rather than `isLoading`, which is only true while a fetch is running.
 * A query with no data is also pending while it waits for the network, and
 * while the persisted cache is being restored at launch; `isLoading` reports
 * both as neither loading nor failed.
 */
export function menuView<T>(query: MenuQueryState<T>): MenuView<T> {
	if (query.data !== undefined) {
		return {kind: 'content', data: query.data}
	}

	if (query.isPending) {
		return query.isPaused ? {kind: 'offline'} : {kind: 'loading'}
	}

	return {kind: 'error', error: query.error ?? new Error('Unknown error')}
}

/** What an offline menu screen with nothing cached says. */
export const OFFLINE_MESSAGE =
	"You're offline, and this menu hasn't been saved on this phone yet. It will load once you're back online."
