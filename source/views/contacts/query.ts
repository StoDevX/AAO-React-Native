import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy, toPairs} from 'lodash'
import {ContactType} from './types'

export const keys = {
	all: ['contacts'] as const,
}

async function fetchContacts({signal}: {signal: AbortSignal}) {
	let response = await client.get('contacts', {signal}).json()
	return (response as {data: ContactType[]}).data
}

export const groupedContactsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchContacts,
	select: (contacts) => {
		let grouped = groupBy(contacts, (c) => c.category)
		return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
	},
})

export const contactByTitleOptions = (
	title: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchContacts,
		select: (contacts) => contacts.find((c) => c.title === title),
	})
