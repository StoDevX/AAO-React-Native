import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {WordType} from './types'

export const keys = {
	all: ['dictionary'] as const,
}

// Dictionary entries change rarely -- matches the 5-minute staleTime
// precedent set by Contacts'/Student Orgs' query.ts, avoiding a redundant
// background refetch every time someone opens a word's detail or editor
// screen right after the list.
const staleTime = 1000 * 60 * 5

async function fetchDictionary({signal}: {signal: AbortSignal}) {
	let response = await client.get('dictionary', {signal}).json()
	return (response as {data: WordType[]}).data
}

export const dictionaryOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchDictionary,
	staleTime,
})

export const wordByTermOptions = (
	word: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchDictionary,
		staleTime,
		select: (words) => words.find((w) => w.word === word),
	})
