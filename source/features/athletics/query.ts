import {client} from '@frogpond/api'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {UITEST_SCORES} from './__fixtures__/scores'
import {Score} from './types'
import {toProcessedScores} from './utils'

export const keys = {
	all: ['athletics', 'scores'] as const,
}

const ACTIVE_GAME_INTERVAL = 30 * 1000
const IDLE_INTERVAL = 5 * 60 * 1000

export const athleticsOptions = queryOptions({
	queryKey: keys.all,
	// UI tests assert against what the tabs do with a week of fixtures, so they
	// need the same week every run. What St. Olaf actually played changes daily,
	// and an empty Today is a legitimate result that proves nothing.
	queryFn: ({signal}): Promise<Score[]> =>
		isUITesting
			? Promise.resolve(UITEST_SCORES)
			: client.get('athletics/scores', {signal}).json<Score[]>(),
	select: toProcessedScores,
	refetchInterval: (query) => {
		const scores = query.state.data
		if (!scores?.length) {
			return IDLE_INTERVAL
		}
		// 'O' marks a game in progress, the same reading ccc-server's cache TTL
		// uses; 'A' covers every game not being played, scheduled or final.
		const hasOngoingGame = scores.some((score) => score.status.indicator === 'O')
		return hasOngoingGame ? ACTIVE_GAME_INTERVAL : IDLE_INTERVAL
	},
})
