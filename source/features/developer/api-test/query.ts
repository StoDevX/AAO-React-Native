import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy} from '@frogpond/collections'

export const keys = {
	all: ['routes'] as const,
}

export interface ServerRoute {
	displayName: string
	path: string
	methods: string[]
	params: string[]
}

/** One method on one route: what a row in the API Tester sends. */
export interface RouteEntry {
	/** Unique among the entries: the method and path together. */
	key: string
	method: string
	path: string
	displayName: string
	params: string[]
}

/**
 * The routes as the API Tester lists them, one entry per method, grouped under
 * the first segment of their path.
 */
export function groupRoutes(routes: ServerRoute[]): {title: string; data: RouteEntry[]}[] {
	let entries = routes.flatMap((route) =>
		route.methods.map((method) => ({
			key: `${method} ${route.path}`,
			method,
			path: route.path,
			displayName: route.displayName,
			params: route.params,
		})),
	)
	let grouped = groupBy(entries, (entry) => entry.path.split('/').find((v) => v) ?? '/')
	return Object.entries(grouped).map(([title, data]) => ({title, data}))
}

export const serverRoutesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('routes', {signal}).json()
		return response as ServerRoute[]
	},
	select: groupRoutes,
})
