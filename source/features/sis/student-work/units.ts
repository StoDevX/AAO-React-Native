import type {FetchStatus} from '@tanstack/react-query'

/// Whether the app knows which unit each posting belongs to: loading at
/// first, then ready or unavailable as a whole.
export type UnitsAvailability = 'loading' | 'ready' | 'unavailable'

/// Data wins over status: React Query keeps a query's data when a later
/// refetch fails, and a map saved from an earlier launch still sorts the
/// board.
export function unitsAvailability(query: {
	data: unknown
	isError: boolean
	fetchStatus: FetchStatus
}): UnitsAvailability {
	if (query.data !== undefined) return 'ready'
	// Offline, a query that has never run is paused and waits for a
	// connection forever; with nothing to show, that is a failure to say so.
	if (query.isError || query.fetchStatus === 'paused') return 'unavailable'
	return 'loading'
}

/// The board postings the published map lacks, whose units the app reads
/// from their details: usually the few that went up since the server's last
/// hour. Without a map, none, since reading every posting one by one is the
/// cost the map exists to avoid.
export function idsNeedingDetail(
	boardIds: string[],
	published: Map<string, string | null> | undefined,
): string[] {
	if (published === undefined) return []
	return boardIds.filter((id) => !published.has(id))
}

/// Every posting's unit the app knows, from the map and from the details it
/// read itself.
export function unitsByPosting(
	published: Map<string, string | null> | undefined,
	fromDetails: Map<string, string | null>,
): Map<string, string | null> {
	let units = new Map(published)
	for (let [id, unit] of fromDetails) {
		units.set(id, unit)
	}
	return units
}
