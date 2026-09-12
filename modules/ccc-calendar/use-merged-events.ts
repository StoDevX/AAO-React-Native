import {useQueries} from '@tanstack/react-query'

import {deviceCalendarOptions, namedCalendarOptions} from './query'
import {type CalendarSource, deviceCalendarIdFrom, isDeviceSourceId} from './sources'

type MergedEvents = {
	failed: CalendarSource[]
	isLoading: boolean
	isRefetching: boolean
	refetchAll: () => Promise<void>
}

/**
 * Runs every enabled source's query -- a remote one now writes into the
 * database rather than returning events, and a device one still returns them
 * directly -- and reports across all of them: which failed, whether any is
 * still loading or refetching, and how to refetch every one. The events
 * themselves are read separately, from the database, by `useOccurrences`.
 */
export function useMergedEvents(sources: CalendarSource[]): MergedEvents {
	let results = useQueries({
		queries: sources.map((source) =>
			isDeviceSourceId(source.id)
				? deviceCalendarOptions(deviceCalendarIdFrom(source.id))
				: namedCalendarOptions(source.id),
		),
	})

	let failed = sources.filter((_, index) => results[index]?.isError)
	let isLoading = results.some((result) => result.isLoading)
	let isRefetching = results.some((result) => result.isRefetching)

	let refetchAll = async () => {
		await Promise.all(results.map((result) => result.refetch()))
	}

	return {failed, isLoading, isRefetching, refetchAll}
}
