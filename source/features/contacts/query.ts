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

// Contacts are hand-curated reference data (see data/contact-info/*.yaml) that
// changes on the order of weeks, not minutes. Without a staleTime, React
// Query's default (0) marks the cache stale immediately, so mounting the
// detail screen -- a second observer on the same queryKey -- triggers a
// background refetch on top of the one the list screen already ran. A few
// minutes of staleness avoids that redundant request while still catching
// same-session edits.
const staleTime = 1000 * 60 * 5 // 5 minutes

export const groupedContactsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchContacts,
	select: (contacts) => {
		let grouped = groupBy(contacts, (c) => c.category)
		return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
	},
	staleTime,
})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const contactByTitleOptions = (title: string) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchContacts,
		select: (contacts) => contacts.find((c) => c.title === title),
		staleTime,
	})
