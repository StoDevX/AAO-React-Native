import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import groupBy from 'lodash/groupBy'

export const keys = {
	all: ['routes'] as const,
}

export interface ServerRoute {
	displayName: string
	path: string
	params: string[]
}

export const serverRoutesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('routes', {signal}).json()
		return response as ServerRoute[]
	},
	select: (routes) => {
		let grouped = groupBy(routes, (r) => r.path.split('/').find((v) => v))
		let groupedRoutes = Object.entries(grouped).map(([key, value]) => ({
			title: key,
			data: value,
		}))

		return groupedRoutes
	},
})
