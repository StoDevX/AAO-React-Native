import {client} from '@frogpond/api'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'

import bundledDictionary from '../../../docs/dictionary.json'
import {REFERENCE_ENTRY} from './lib/reference-entry'
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
	// UI tests assert against what the screen does with an entry, so they need
	// the same entries every run. The live server's copy changes on someone
	// else's schedule, and a word renamed there fails a test here for no
	// reason we could act on.
	if (isUITesting) {
		return [...(bundledDictionary as {data: WordType[]}).data, REFERENCE_ENTRY]
	}

	let response = await client.get('dictionary', {signal}).json()
	return (response as {data: WordType[]}).data
}

export const dictionaryOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchDictionary,
	staleTime,
})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const wordByTermOptions = (word: string) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchDictionary,
		staleTime,
		select: (words) => words.find((w) => w.word === word),
	})
