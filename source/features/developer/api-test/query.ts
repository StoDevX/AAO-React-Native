import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy} from '@frogpond/collections'
import type {CampusId} from '../../../campuses'

export const keys = {
	all: (campus: CampusId) => ['routes', campus] as const,
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

const SITEMAP_PATH = '/v1/routes'

/**
 * Where the server mounts its routes, read off the sitemap's own entry: `/stolaf`
 * when it lists itself at `/stolaf/v1/routes`. Behind a proxy that strips that
 * mount, the app reaches each route without it.
 */
function mountOf(routes: ServerRoute[]): string {
	let sitemap = routes.find((route) => route.path.endsWith(SITEMAP_PATH))
	return sitemap ? sitemap.path.slice(0, -SITEMAP_PATH.length) : ''
}

/**
 * The routes as the API Tester lists them, one entry per method, grouped under
 * the first segment of their path. Each path is given from the server's root,
 * without its mount.
 */
export function groupRoutes(routes: ServerRoute[]): {title: string; data: RouteEntry[]}[] {
	let mount = mountOf(routes)
	let entries = routes.flatMap((route) =>
		route.methods.map((method) => {
			let path = route.path.slice(mount.length)
			return {
				key: `${method} ${path}`,
				method,
				path,
				displayName: route.displayName,
				params: route.params,
			}
		}),
	)
	let grouped = groupBy(entries, (entry) => entry.path.split('/').find((v) => v) ?? '/')
	return Object.entries(grouped).map(([title, data]) => ({title, data}))
}

/** The routes of `campus`'s server; the API Tester asks the active campus's. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const serverRoutesOptions = (campus: CampusId) =>
	queryOptions({
		queryKey: keys.all(campus),
		// The routes of whichever server the app points at now: restored from
		// storage they could be another server's, or an older shape of this one's.
		meta: {persist: false},
		queryFn: async ({signal}) => {
			let response = await clientFor(campus).get('routes', {signal}).json()
			return response as ServerRoute[]
		},
		select: groupRoutes,
	})
