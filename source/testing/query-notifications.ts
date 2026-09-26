/**
 * Waits for React Query to tell its subscribers about a query that has settled. Its notifyManager
 * schedules those notifications with a real `setTimeout(0)`, not a microtask, so they land on the
 * turn after the query settles; wrap the wait in `act()`, since the component re-renders then.
 */
export function flushQueryNotifications(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0))
}
