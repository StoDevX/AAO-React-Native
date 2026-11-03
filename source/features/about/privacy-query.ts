import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import type {CampusId} from '../../campuses'

/** The privacy policy in the server's answer, which is the published `privacy.json`. */
export function privacyTextFrom(raw: unknown): string {
	let text = typeof raw === 'object' && raw !== null ? (raw as {text?: unknown}).text : undefined
	if (typeof text !== 'string' || text === '') {
		throw new Error('The server sent no privacy policy.')
	}
	return text
}

/** The app's privacy policy, as `campus`'s server answers it. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const privacyOptions = (campus: CampusId) =>
	queryOptions({
		queryKey: [campus, 'privacy'],
		queryFn: async ({signal}) =>
			privacyTextFrom(await clientFor(campus).get('privacy', {signal}).json()),
		// Nothing is bundled, so a refresh that fails offline must not drop the
		// stored copy.
		meta: {persistAfterFailure: true},
	})

/**
 * What the privacy screen shows. A policy it already has wins over a failed
 * refresh, so the screen keeps working offline from its cached copy.
 */
export function privacyScreenState(query: {
	data: string | undefined
	isLoading: boolean
}): 'policy' | 'loading' | 'error' {
	if (query.data !== undefined) return 'policy'
	return query.isLoading ? 'loading' : 'error'
}
