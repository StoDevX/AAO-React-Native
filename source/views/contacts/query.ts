import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy, toPairs} from 'lodash'
import {ContactType} from './types'

export const keys = {
	all: ['contacts'] as const,
}

export const groupedContactsOptions = queryOptions({
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
