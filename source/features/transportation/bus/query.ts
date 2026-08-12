import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {UnprocessedBusLine} from './types'

export const keys = {
	all: ['transit', 'bus-routes'] as const,
}

async function fetchBusRoutes({
	signal,
}: {
	signal: AbortSignal
}): Promise<UnprocessedBusLine[]> {
	let response = await client.get('transit/bus', {signal}).json()
	return (response as {data: UnprocessedBusLine[]}).data
}

export const busRoutesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchBusRoutes,
})

export const busLineOptions = (
	lineName: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchBusRoutes,
		select: (lines) => lines.find((l) => l.line === lineName),
	})
