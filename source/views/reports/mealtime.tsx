import * as React from 'react'
import {useStavReport} from './query'
import {LoadingView} from '@frogpond/notice'
import {BusynessChart} from '@frogpond/chart'

export const StavMealtimeReport = (): JSX.Element => {
	let {
		data = [],
		error,
		refetch,
		isRefetching,
		isError,
		isLoading,
	} = useStavReport()

	if (isLoading) {
		return <LoadingView text="Loading busyness report…" />
	}

	return <BusynessChart {...data} />
}
