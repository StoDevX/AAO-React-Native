import {DirectorySearchTypeEnum, SearchResults} from './types'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import ky from 'ky'

let directory = ky.create({prefixUrl: 'https://www.stolaf.edu/directory'})

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
	all: (query: ReturnType<typeof getDirectoryQuery>) =>
		['directory', query] as const,
}

export function useDirectoryEntries(
	query: string,
	type: DirectorySearchTypeEnum,
): UseQueryResult<SearchResults, unknown> {
	return useQuery({
		queryKey: keys.all(getDirectoryQuery({query, type})),
		queryFn: async ({queryKey: [_, query], signal}) => {
			let response = await directory
				.get('search', {searchParams: query, signal})
				.json()
			return response as SearchResults
		},
		staleTime: 1000 * 60, // 1 minute
	})
}
