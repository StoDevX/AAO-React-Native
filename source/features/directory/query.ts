import ky from 'ky'
import {apiFetch} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
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
	// Through `apiFetch`, so a campus answered from fixtures answers its search too.
	let response = await ky
		.get('search', {baseUrl: searchUrl, searchParams: searchQuery, signal, fetch: apiFetch})
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
		// The landing and the Keep Typing notice show no results, so there is nothing to ask for
		// until there are two letters.
		enabled: query.trim().length >= 2,
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
