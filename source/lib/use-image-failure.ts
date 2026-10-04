import {useEffect, useState} from 'react'
import {onlineManager} from '@tanstack/react-query'

/**
 * Whether an image has failed to load, and the `onError` that says so. A
 * remote picture can fail -- no network and nothing cached, or a file the
 * server does not have -- and the screen then leaves it out rather than
 * drawing an empty frame. Tracked by address, so a new image gets a new try,
 * and cleared when the device comes back online, so a screen that stayed
 * mounted through an outage tries again.
 */
export function useImageFailure(uri: string | undefined): readonly [boolean, () => void] {
	let [failedUri, setFailedUri] = useState<string | undefined>(undefined)

	useEffect(
		() =>
			onlineManager.subscribe((online) => {
				if (online) {
					setFailedUri(undefined)
				}
			}),
		[],
	)

	return [uri !== undefined && failedUri === uri, () => setFailedUri(uri)] as const
}
