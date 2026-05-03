import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {ProcessedScore, Score} from './types'

export const keys = {
	all: ['athletics', 'scores'] as const,
}

export const athleticsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: ({signal}): Promise<Score[]> =>
		client.get('athletics/scores', {signal}).json<Score[]>(),
	select: (scores): ProcessedScore[] =>
		scores.map((score) => ({...score, parsedDate: new Date(score.date_utc)})),
})
