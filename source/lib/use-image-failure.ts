import {useState} from 'react'

/**
 * Whether an image has failed to load, and the `onError` that says so. A
 * remote picture can fail -- no network and nothing cached, or a file the
 * server does not have -- and the screen then leaves it out rather than
 * drawing an empty frame. Tracked by address, so a new image gets a new try.
 */
export function useImageFailure(uri: string | undefined): readonly [boolean, () => void] {
	let [failedUri, setFailedUri] = useState<string | undefined>(undefined)
	return [uri !== undefined && failedUri === uri, () => setFailedUri(uri)] as const
}
