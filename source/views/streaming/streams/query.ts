import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import moment, {type Moment} from 'moment-timezone'
import {RawStreamType, StreamType} from './types'
import {timezone} from '@frogpond/constants'
import {toLaxTitleCase} from '@frogpond/titlecase'

export const keys = {
	all: (filter: {sort: 'ascending'; dateFrom: string; dateTo: string}) =>
		['streams', filter] as const,
}

function processStreams(stream: RawStreamType): StreamType {
	let date: Moment = moment(stream.starttime)
	let dateGroup = date.format('dddd, MMMM Do')

	let group = stream.status.toLowerCase() !== 'live' ? dateGroup : 'Live'

	return {
		...stream,
		// force title-case on the stream types, to prevent not-actually-duplicate headings
		category: toLaxTitleCase(stream.category),
		renderedDate: date.format('h:mm A – ddd, MMM. Do, YYYY'),
		$groupBy: group,
	}
}

export function useStreams(
	date: Moment = moment.tz(timezone()),
): UseQueryResult<StreamType[], unknown> {
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
			let response = await client
				.get('streams/upcoming', {
					signal,
					searchParams: {sort, dateFrom, dateTo},
				})
				.json()
			return response as StreamType[]
		},
		select(data) {
			return data.map(processStreams)
		},
	})
}
