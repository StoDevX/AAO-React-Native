import ky from 'ky'
import {queryOptions} from '@tanstack/react-query'
import {AthleticsResponse, Score} from './types'

export const keys = {
	all: ['athletics', 'scores'] as const,
}

// TODO: move this behind the AAO proxy server
const ATHLETICS_URL =
	'https://athletics.stolaf.edu/services/scores_chris.aspx?format=json'

export const athleticsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}): Promise<Score[]> => {
		const response = await ky
			.get(ATHLETICS_URL, {signal})
			.json<AthleticsResponse>()
		return response.scores
	},
})
