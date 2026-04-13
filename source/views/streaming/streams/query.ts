import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {Temporal} from 'temporal-polyfill'
import {format, now as temporalNow} from '../../../lib/temporal'
import {StreamType} from './types'
import {timezone} from '@frogpond/constants'

export const keys = {
	all: (filter: {sort: 'ascending'; dateFrom: string; dateTo: string}) =>
		['streams', filter] as const,
}

export const streamsOptionsFor = (
	date: Temporal.ZonedDateTime = temporalNow(timezone()),
) => {
	const dateFromFormatted = format(date, 'YYYY-MM-DD')
	const dateToFormatted = format(date.add({months: 2}), 'YYYY-MM-DD')

	const searchParams = {
		sort: 'ascending',
		dateFrom: dateFromFormatted,
		dateTo: dateToFormatted,
	} as const

	return queryOptions({
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
