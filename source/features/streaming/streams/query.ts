import {queryOptions} from '@tanstack/react-query'
import type {Moment} from 'moment-timezone'
import {StreamType} from './types'
import {timezone} from '@frogpond/constants'
import {now} from '@frogpond/timer'
import {clientForSection} from '../../campus/section-client'

export const keys = {
	all: (filter: {sort: 'ascending'; dateFrom: string; dateTo: string}) =>
		['streams', filter] as const,
}

/// Two months of streams from `date`, the app clock's day on campus unless
/// given another, so a frozen or overridden clock asks for the same window on
/// any day it runs.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const streamsOptionsFor = (date: Moment = now().tz(timezone())) => {
	const dateFromFormatted = date.format('YYYY-MM-DD')
	const dateToFormatted = date.clone().add(2, 'month').format('YYYY-MM-DD')

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
			const response = await clientForSection('streaming')
				.get('streams/upcoming', {
					signal,
					searchParams: {sort, dateFrom: queryDateFrom, dateTo: queryDateTo},
				})
				.json()
			return response as StreamType[]
		},
	})
}
