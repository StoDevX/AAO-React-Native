import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'

import {WordType} from './types'
import type {CampusId} from '../../campuses'

export const keys = {
	/** By server, so each campus's dictionary sits under its own key. */
	forServer: (server: CampusId) => [server, 'dictionary'] as const,
}

// Dictionary entries change rarely -- matches the 5-minute staleTime
// precedent set by directory/contacts-query.ts and student-orgs/query.ts,
// avoiding a redundant background refetch every time someone opens a word's
// detail or editor screen right after the list.
const staleTime = 1000 * 60 * 5

async function fetchDictionary(server: CampusId, {signal}: {signal: AbortSignal}) {
	let response = await clientFor(server).get('dictionary', {signal}).json()
	return (response as {data: WordType[]}).data
}

/** The dictionary on `server`, the active campus's dictionary server. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const dictionaryOptionsFor = (server: CampusId) =>
	queryOptions({
		queryKey: keys.forServer(server),
		queryFn: (context) => fetchDictionary(server, context),
		staleTime,
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const wordByTermOptions = (word: string, server: CampusId) =>
	queryOptions({
		queryKey: keys.forServer(server),
		queryFn: (context) => fetchDictionary(server, context),
		staleTime,
		select: (words) => words.find((w) => w.word === word),
	})
