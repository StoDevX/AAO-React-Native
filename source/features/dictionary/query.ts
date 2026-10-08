import {carletonClient, stolafClient} from '@frogpond/api'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'

import bundledDictionary from '../../../docs/dictionary.json'
import {REFERENCE_ENTRY} from './lib/reference-entry'
import {WordType} from './types'
import type {Campus} from '../campus/store'

export const keys = {
	all: ['dictionary'] as const,
	/** St. Olaf's keeps the key it always had; Carleton's sits under the campus, as its map's does. */
	forCampus: (campus: Campus): readonly string[] =>
		campus === 'carleton' ? (['carleton', 'dictionary'] as const) : keys.all,
}

// Dictionary entries change rarely -- matches the 5-minute staleTime
// precedent set by directory/contacts-query.ts and student-orgs/query.ts,
// avoiding a redundant background refetch every time someone opens a word's
// detail or editor screen right after the list.
const staleTime = 1000 * 60 * 5

async function fetchDictionary(campus: Campus, {signal}: {signal: AbortSignal}) {
	// UI tests assert against what the screen does with an entry, so they need
	// the same entries every run. The live server's copy changes on someone
	// else's schedule, and a word renamed there fails a test here for no
	// reason we could act on.
	if (isUITesting) {
		return [...(bundledDictionary as {data: WordType[]}).data, REFERENCE_ENTRY]
	}

	let api = campus === 'carleton' ? carletonClient : stolafClient
	let response = await api.get('dictionary', {signal}).json()
	return (response as {data: WordType[]}).data
}

/** `campus`'s dictionary. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const dictionaryOptionsFor = (campus: Campus) =>
	queryOptions({
		queryKey: keys.forCampus(campus),
		queryFn: (context) => fetchDictionary(campus, context),
		staleTime,
	})

export const dictionaryOptions = dictionaryOptionsFor('stolaf')

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const wordByTermOptions = (word: string, campus: Campus = 'stolaf') =>
	queryOptions({
		queryKey: keys.forCampus(campus),
		queryFn: (context) => fetchDictionary(campus, context),
		staleTime,
		select: (words) => words.find((w) => w.word === word),
	})
