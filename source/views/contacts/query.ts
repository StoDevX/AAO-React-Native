import {client} from '@frogpond/api'

import {ContactType} from './types'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {groupBy, toPairs} from 'lodash'

export const keys = {
	all: ['contacts'] as const,
}

export function useGroupedContacts(): UseQueryResult<
	Array<{title: string; data: ContactType[]}>,
	unknown
> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('contacts', {signal}).json()
			return (response as {data: ContactType[]}).data
		},
		select: (contacts) => {
			let grouped = groupBy(contacts, (c) => c.category)
			return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
		},
	})
}
