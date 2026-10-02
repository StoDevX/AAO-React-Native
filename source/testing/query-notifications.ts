import {act, waitFor} from '@testing-library/react-native'
import type {QueryClient} from '@tanstack/react-query'

/**
 * Waits for React Query to tell its subscribers about a query that has settled. Its notifyManager
 * schedules those notifications with a real `setTimeout(0)`, not a microtask, so they land on the
 * turn after the query settles; wrap the wait in `act()`, since the component re-renders then.
 */
export function flushQueryNotifications(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Waits for every query on `client` to settle and for its subscribers to hear of it. A screen that
 * starts a fetch of its own, such as a row looking up its photo, can otherwise finish after a
 * test's last assertion and re-render outside `act()`.
 */
export async function waitForQueriesToSettle(client: QueryClient): Promise<void> {
	await waitFor(() => {
		if (client.isFetching() > 0) throw new Error('a query is still fetching')
	})
	await act(flushQueryNotifications)
}
