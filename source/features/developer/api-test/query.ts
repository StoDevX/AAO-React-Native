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
	params: string[]
}

/** The routes of `campus`'s server; the API Tester asks the active campus's. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const serverRoutesOptions = (campus: CampusId) =>
	queryOptions({
		queryKey: keys.all(campus),
		queryFn: async ({signal}) => {
			let response = await clientFor(campus).get('routes', {signal}).json()
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
