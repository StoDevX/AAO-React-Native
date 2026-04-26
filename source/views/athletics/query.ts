import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {Score} from './types'

export const keys = {
	all: ['athletics', 'scores'] as const,
}

export const athleticsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}): Promise<Score[]> => {
		return client.get('athletics/scores', {signal}).json<Score[]>()
	},
})
