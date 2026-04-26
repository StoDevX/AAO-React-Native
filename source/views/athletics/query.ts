import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {Score} from './types'

export const keys = {
	all: ['athletics', 'scores'] as const,
}

export const athleticsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: ({signal}): Promise<Score[]> =>
		client.get('athletics/scores', {signal}).json<Score[]>(),
})
