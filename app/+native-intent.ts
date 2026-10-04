import {router} from 'expo-router'

/** How long the router gets to run a queued dismissal before the link is routed. */
const DISMISS_SETTLE_MS = 50

/**
 * Runs for every link iOS hands the app, a Home Screen quick action included.
 * A sheet such as Customize or the KSTO schedule would otherwise stay open
 * under the destination, so close back to the root first. A cold launch has
 * nothing open, and the router is not mounted yet.
 *
 * `dismissAll` only queues the pop, and the router runs the queue after its
 * next render. The link is routed right after this returns, so on a warm app
 * the path comes back late, once the pop has run; routing it at once would
 * open the destination first and leave the sheet under it.
 */
export function redirectSystemPath({
	path,
	initial,
}: {
	path: string
	initial: boolean
}): string | Promise<string> {
	if (initial || !router.canDismiss()) {
		return path
	}

	// Guarded by canDismiss, and closing every sheet at once is the point; goBack() would close one.
	// oxlint-disable-next-line no-restricted-properties
	router.dismissAll()
	return new Promise((resolve) => {
		setTimeout(() => resolve(path), DISMISS_SETTLE_MS)
	})
}
