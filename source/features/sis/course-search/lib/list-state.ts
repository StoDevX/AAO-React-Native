import {listState, type ListState} from '@frogpond/notice'
import {onlineManager} from '@tanstack/react-query'

/** Which state course search draws, from the catalog refresh and the results read. */
export function courseListState(
	catalog: {isError: boolean; isPending: boolean; isPaused: boolean},
	results: {hasCatalog: boolean; isPending: boolean; failed: boolean},
): ListState {
	return listState({
		hasData: results.hasCatalog,
		isError: catalog.isError || results.failed,
		isPending: catalog.isPending || results.isPending,
		isPaused: catalog.isPaused,
		isOnline: onlineManager.isOnline(),
	})
}
