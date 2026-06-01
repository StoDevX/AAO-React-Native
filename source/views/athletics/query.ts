import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {ProcessedScore, Score} from './types'
import {parseGameDate} from './utils'

export const keys = {
	all: ['athletics', 'scores'] as const,
}

export const athleticsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: ({signal}): Promise<Score[]> =>
		client.get('athletics/scores', {signal}).json<Score[]>(),
	select: (scores): ProcessedScore[] =>
		scores.map((score) => ({
			...score,
			parsedDate: parseGameDate(score.date_utc),
		})),
})
