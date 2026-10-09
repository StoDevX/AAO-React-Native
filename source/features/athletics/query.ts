import {clientFor} from '@frogpond/api'
import {servesBundledFixtures} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {UITEST_SCORES} from './__fixtures__/scores'
import {Score} from './types'
import {isInPlay, toProcessedScores} from './utils'

export const keys = {
	all: ['athletics', 'scores'] as const,
}

const ACTIVE_GAME_INTERVAL = 30 * 1000
const IDLE_INTERVAL = 5 * 60 * 1000

export const athleticsOptions = queryOptions({
	queryKey: keys.all,
	// UI tests naming no campus assert against what the tabs do with a week of fixtures, so they
	// need the same week every run. What St. Olaf actually played changes daily,
	// and an empty Today is a legitimate result that proves nothing.
	queryFn: ({signal}): Promise<Score[]> =>
		servesBundledFixtures
			? Promise.resolve(UITEST_SCORES)
			: // St. Olaf's server: only St. Olaf's Home offers athletics.
				clientFor('edu.stolaf').get('athletics/scores', {signal}).json<Score[]>(),
	select: toProcessedScores,
	refetchInterval: (query) => {
		const scores = query.state.data
		if (!scores?.length) {
			return IDLE_INTERVAL
		}
		const now = new Date()
		return scores.some((score) => isInPlay(score, now)) ? ACTIVE_GAME_INTERVAL : IDLE_INTERVAL
	},
})
