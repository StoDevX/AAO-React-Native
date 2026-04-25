import ky from 'ky'
import {queryOptions} from '@tanstack/react-query'
import {AthleticsResponse, DateGroupedScores} from './types'
import {groupScoresByDate} from './utils'

export const keys = {
	all: ['athletics', 'scores'] as const,
}

// TODO: move this behind the AAO proxy server
const ATHLETICS_URL =
	'http://athletics.stolaf.edu/services/scores_chris.aspx?format=json'

export const athleticsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}): Promise<DateGroupedScores[]> => {
		const response = await ky.get(ATHLETICS_URL, {signal}).json<AthleticsResponse>()
		return groupScoresByDate(response.scores)
	},
})
