import {queryOptions} from '@tanstack/react-query'

import type {CampusId} from '../../campuses'

/**
 * Where ccc-server's Worker lists its open pull requests and the Preview each
 * branch is deployed to.
 */
export const WORKER_PREVIEWS_URL = 'https://ccc-server.frog-pond-d8f.workers.dev/previews'

/** An open ccc-server pull request and the Preview its branch is deployed to. */
export type WorkerPreview = {
	number: number
	title: string
	branch: string
	prUrl: string
	/** Null for a fork's branch, or one whose Preview name Cloudflare shortens. */
	previewUrl: string | null
}

const isPreview = (value: unknown): value is WorkerPreview => {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	let entry = value as Record<string, unknown>
	return (
		typeof entry['number'] === 'number' &&
		typeof entry['title'] === 'string' &&
		typeof entry['branch'] === 'string' &&
		typeof entry['prUrl'] === 'string' &&
		(typeof entry['previewUrl'] === 'string' || entry['previewUrl'] === null)
	)
}

/** The previews in a `/previews` response, or an error naming what was wrong with it. */
export function parsePreviews(body: unknown): WorkerPreview[] {
	if (!Array.isArray(body)) {
		throw new TypeError('Expected a list of previews')
	}
	return body.filter(isPreview)
}

/**
 * The server address a campus uses on a Preview. The Worker serves each campus
 * under its id, and the Node server's routes under `/v1` beneath that, which
 * is what the app calls.
 */
export function previewServerUrl(previewUrl: string, campus: CampusId): string {
	return `${previewUrl.replace(/\/+$/u, '')}/${campus}/v1/`
}

/**
 * The open pull requests and their Previews. Never fetched on its own: the
 * Developer screen turns it on only when asked, so opening it costs nothing.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const workerPreviewsOptions = () =>
	queryOptions({
		queryKey: ['developer', 'worker-previews', WORKER_PREVIEWS_URL],
		queryFn: async ({signal}) => {
			let response = await fetch(WORKER_PREVIEWS_URL, {signal})
			if (!response.ok) {
				// The Worker explains a failure in `message`, such as GitHub's rate limit.
				let body: unknown = await response.json().catch(() => null)
				let message =
					typeof body === 'object' && body !== null && 'message' in body
						? String(body.message)
						: `HTTP ${response.status}`
				throw new Error(`Couldn't fetch previews: ${message}`)
			}
			return parsePreviews(await response.json())
		},
		enabled: false,
		retry: false,
		staleTime: 60_000,
	})
