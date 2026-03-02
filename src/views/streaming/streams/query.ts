import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import moment, {type Moment} from 'moment-timezone'
import {StreamType} from './types'
import {timezone} from '@frogpond/constants'

export const keys = {
	all: (filter: {sort: 'ascending'; dateFrom: string; dateTo: string}) =>
		['streams', filter] as const,
}

export function useStreams(
	date: Moment = moment.tz(timezone()),
): UseQueryResult<StreamType[], unknown> {
	const dateFromFormatted = date.format('YYYY-MM-DD')
	const dateToFormatted = date.clone().add(2, 'month').format('YYYY-MM-DD')

	const searchParams = {
		sort: 'ascending',
		dateFrom: dateFromFormatted,
		dateTo: dateToFormatted,
	} as const

	return useQuery({
		queryKey: keys.all(searchParams),
		queryFn: async ({
			queryKey: [_group, {sort, dateFrom: queryDateFrom, dateTo: queryDateTo}],
			signal,
		}) => {
			const response = await client
				.get('streams/upcoming', {
					signal,
					searchParams: {sort, dateFrom: queryDateFrom, dateTo: queryDateTo},
				})
				.json()
			return response as StreamType[]
		},
	})
}
