import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {UnprocessedBusLine} from './types'
import type {CampusId} from '../../../campuses'

export const keys = {
	/** By server, so each campus's lines sit under its own key. */
	forServer: (server: CampusId) => [server, 'transit', 'bus-routes'] as const,
}

async function fetchBusRoutes(
	server: CampusId,
	{signal}: {signal: AbortSignal},
): Promise<UnprocessedBusLine[]> {
	let response = await clientFor(server).get('transit/bus', {signal}).json()
	return (response as {data: UnprocessedBusLine[]}).data
}

/** The bus lines on `server`, the active campus's transit server. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const busRoutesOptionsFor = (server: CampusId) =>
	queryOptions({
		queryKey: keys.forServer(server),
		queryFn: (context) => fetchBusRoutes(server, context),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const busLineOptions = (lineName: string, server: CampusId) =>
	queryOptions({
		queryKey: keys.forServer(server),
		queryFn: (context) => fetchBusRoutes(server, context),
		select: (lines) => lines.find((l) => l.line === lineName),
	})
