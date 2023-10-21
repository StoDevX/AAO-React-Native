import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import groupBy from 'lodash/groupBy'

export const keys = {
	all: ['routes'] as const,
}

export interface ServerRoute {
	displayName: string
	path: string
	params: string[]
}

export function useServerRoutes(): UseQueryResult<
	Array<{title: string; data: ServerRoute[]}>,
	unknown
> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('routes', {signal}).json()
			return response as ServerRoute[]
		},
		select: (routes) => {
			let grouped = groupBy(routes, (r) => {
				const parts = r.path.split('/').filter((v) => v)
				return parts[0]
			})
			let groupedRoutes = Object.entries(grouped).map(([key, value]) => ({
				title: key,
				data: value,
			}))

			return groupedRoutes
		},
	})
}
