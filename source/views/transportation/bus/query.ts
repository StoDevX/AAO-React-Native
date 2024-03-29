import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {UnprocessedBusLine} from './types'

export const keys = {
	all: ['transit', 'bus-routes'] as const,
}

export function useBusRoutes(): UseQueryResult<UnprocessedBusLine[], unknown> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('transit/bus', {signal}).json()
			return (response as {data: UnprocessedBusLine[]}).data
		},
	})
}
