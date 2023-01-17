import {client} from '@frogpond/api'
import {useQuery} from '@tanstack/react-query'
import {groupBy, toPairs} from 'lodash'
import {queryClient} from '../../init/tanstack-query'
import {ContactType} from './types'

export const keys = {
	all: ['contacts'] as const,
}

queryClient.setQueryData(keys.all, require('../../docs/contact-info.json'))

export function useGroupedContacts() {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('/contacts', {signal}).json()
			return (response as {data: ContactType[]}).data
		},
		select: (contacts) => {
			let grouped = groupBy(contacts, (c) => c.category)
			return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
		},
	})
}
