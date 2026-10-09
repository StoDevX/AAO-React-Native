import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy} from '@frogpond/collections'

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
		// The API Tester lists St. Olaf's server, as it always has.
		let response = await clientFor('edu.stolaf').get('routes', {signal}).json()
		return response as ServerRoute[]
	},
	select: (routes) => {
		let grouped = groupBy(routes, (r) => r.path.split('/').find((v) => v) ?? '/')
		let groupedRoutes = Object.entries(grouped).map(([key, value]) => ({
			title: key,
			data: value,
		}))

		return groupedRoutes
	},
})
