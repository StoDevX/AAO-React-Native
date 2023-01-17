import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import moment, {type Moment} from 'moment-timezone'
import { StreamType } from './types'
import {timezone} from '@frogpond/constants'

export const keys = {
	all: (filter: {sort: 'ascending', dateFrom: string, dateTo: string}) => ['streams', filter] as const,
}

export function useStreams(date: Moment = moment.tz(timezone())): UseQueryResult<StreamType[], unknown> {
    let dateFrom = date.format('YYYY-MM-DD')
	let dateTo = date.clone().add(2, 'month').format('YYYY-MM-DD')

    let searchParams = {
        sort: 'ascending',
        dateFrom,
        dateTo,
    } as const

	return useQuery({
		queryKey: keys.all(searchParams),
		queryFn: async ({queryKey: [_group, {sort, dateFrom, dateTo}], signal}) => {
			let response = await client.get('/streams/upcoming', {signal, searchParams: {sort, dateFrom, dateTo}}).json()
			return response as StreamType[]
		},
	})
}
