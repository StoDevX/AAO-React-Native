import {client} from '@frogpond/api'
import {useQuery, type UseQueryResult} from '@tanstack/react-query'
import {StavReportType} from './types'

export const keys = {
	stav: () => ['stav'] as const,
}

export function useStavReport(): UseQueryResult<StavReportType[], unknown> {
	return useQuery({
		queryKey: keys.stav(),
		queryFn: async ({queryKey, signal}) => {
			let response = await client
				.get(`reports/${keys.stav()[0]}`, {signal})
				.json()
			return response as StavReportType[]
		},
	})
}
