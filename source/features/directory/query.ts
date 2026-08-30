import ky from 'ky'
import {queryOptions} from '@tanstack/react-query'
import {DirectorySearchTypeEnum, SearchResults} from './types'
import {formatResults} from './helpers'

let directory = ky.create({baseUrl: 'https://www.stolaf.edu/directory/'})

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
	all: (query: ReturnType<typeof getDirectoryQuery>) => ['directory', query] as const,
}

const staleTime = 1000 * 60 // 1 minute

async function fetchDirectoryEntries(
	searchQuery: ReturnType<typeof getDirectoryQuery>,
	signal?: AbortSignal,
): Promise<SearchResults> {
	let response = await directory.get('search', {searchParams: searchQuery, signal}).json()
	return response as SearchResults
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const directoryEntriesOptions = (query: string, type: DirectorySearchTypeEnum) =>
	queryOptions({
		queryKey: keys.all(getDirectoryQuery({query, type})),
		queryFn: ({signal}) => fetchDirectoryEntries(getDirectoryQuery({query, type}), signal),
		staleTime,
	})

export const directoryContactOptions = (
	query: string,
	type: DirectorySearchTypeEnum,
	index: number,
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all(getDirectoryQuery({query, type})),
		queryFn: ({signal}) => fetchDirectoryEntries(getDirectoryQuery({query, type}), signal),
		staleTime,
		select: (data) => formatResults(data.results)[index],
	})
