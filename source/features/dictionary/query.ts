import {clientFor} from '@frogpond/api'
import {servesBundledFixtures} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'

import bundledDictionary from '../../../docs/dictionary.json'
import {REFERENCE_ENTRY} from './lib/reference-entry'
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
	// UI tests naming no campus assert against what the screen does with an entry, so they need
	// the same entries every run. The live server's copy changes on someone
	// else's schedule, and a word renamed there fails a test here for no
	// reason we could act on.
	if (servesBundledFixtures) {
		return [...(bundledDictionary as {data: WordType[]}).data, REFERENCE_ENTRY]
	}

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
