import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import type {CampusId} from '../../campuses'
import {APP} from '../../lib/app-identity'

/** The privacy policy in the server's answer, which is the published `privacy.json`. */
export function privacyTextFrom(raw: unknown): string {
	let text = typeof raw === 'object' && raw !== null ? (raw as {text?: unknown}).text : undefined
	if (typeof text !== 'string' || text === '') {
		throw new Error('The server sent no privacy policy.')
	}
	return text
}

/**
 * This app's privacy policy, from `campus`'s server. The policy is the app's,
 * not the campus's, so it is asked for by app: CARLS's is its own even while it
 * shows St. Olaf.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const privacyOptions = (campus: CampusId) =>
	queryOptions({
		queryKey: [campus, 'privacy', APP],
		queryFn: async ({signal}) =>
			privacyTextFrom(await clientFor(campus).get(`privacy/${APP}`, {signal}).json()),
		// Nothing is bundled, so a refresh that fails offline must not drop the
		// stored copy.
		meta: {persistAfterFailure: true},
	})
