import {router} from 'expo-router'

/**
 * Runs for every link iOS hands the app, a Home Screen quick action included.
 * A sheet such as Customize or the KSTO schedule would otherwise stay open
 * under the destination, so close back to the root first. A cold launch has
 * nothing open, and the router is not mounted yet.
 */
export function redirectSystemPath({path, initial}: {path: string; initial: boolean}): string {
	if (!initial && router.canDismiss()) {
		router.dismissAll()
	}
	return path
}
