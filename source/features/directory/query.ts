import ky from 'ky'
import {servesBundledFixtures} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {UITEST_DIRECTORY_RESULTS} from './__fixtures__/entries'
import {DirectorySearchTypeEnum, SearchResults} from './types'
import {formatResults} from './helpers'
import type {DirectorySection} from './campus-section'

type GetDirectoryQueryArgs = {
	query: string
	type: DirectorySearchTypeEnum
}

const getDirectoryQuery = ({query, type}: GetDirectoryQueryArgs) => {
	let common = {format: 'json'}
	query = query.trim()

	switch (type) {
		case 'department':
			return {...common, department: query}
		case 'firstName':
			return {...common, firstname: query}
		case 'lastName':
			return {...common, lastname: query}
		case 'major':
			return {...common, major: query}
		case 'query':
			return {...common, query: query}
		case 'title':
			return {...common, title: query}
		case 'username':
			return {...common, email: query}
		default: {
			let _neverHitMe: never = type
		}
	}
}

export const keys = {
	all: (searchUrl: string, query: ReturnType<typeof getDirectoryQuery>) =>
		['directory', searchUrl, query] as const,
}

const staleTime = 1000 * 60 // 1 minute

async function fetchDirectoryEntries(
	searchUrl: string,
	searchQuery: ReturnType<typeof getDirectoryQuery>,
	signal?: AbortSignal,
): Promise<SearchResults> {
	// The live directory is whoever works at St. Olaf this week, so a test
	// searching it cannot say what it will find -- see
	// `source/features/dictionary/query.ts` for the same reasoning about
	// entries.
	if (servesBundledFixtures) {
		return UITEST_DIRECTORY_RESULTS
	}

	let response = await ky
		.get('search', {baseUrl: searchUrl, searchParams: searchQuery, signal})
		.json()
	return response as SearchResults
}

export const directoryEntriesOptions = (
	directory: DirectorySection,
	query: string,
	type: DirectorySearchTypeEnum,
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all(directory.searchUrl, getDirectoryQuery({query, type})),
		queryFn: ({signal}) =>
			fetchDirectoryEntries(directory.searchUrl, getDirectoryQuery({query, type}), signal),
		staleTime,
	})

export const directoryContactOptions = (
	directory: DirectorySection,
	query: string,
	type: DirectorySearchTypeEnum,
	index: number,
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all(directory.searchUrl, getDirectoryQuery({query, type})),
		queryFn: ({signal}) =>
			fetchDirectoryEntries(directory.searchUrl, getDirectoryQuery({query, type}), signal),
		staleTime,
		select: (data) => formatResults(data.results)[index],
	})
