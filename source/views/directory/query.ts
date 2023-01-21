import ky from 'ky'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {DirectorySearchTypeEnum, SearchResults} from './types'

let directory = ky.create({prefixUrl: 'https://www.stolaf.edu/directory'})

const getDirectoryParams = (query: string, type: DirectorySearchTypeEnum) => {
	let p = new URLSearchParams()
	p.append('format', 'json')

	query = query.trim()

	switch (type) {
		case 'department':
			p.append('department', query)
			break
		case 'firstName':
			p.append('firstname', query)
			break
		case 'lastName':
			p.append('lastname', query)
			break
		case 'major':
			p.append('major', query)
			break
		case 'query':
			p.append('query', query)
			break
		case 'title':
			p.append('title', query)
			break
		case 'username':
			p.append('email', query)
			break
		default: {
			let _neverHitMe: never = type
		}
	}

	return p.toString()
}

export const keys = {
	all: (query: string, type: DirectorySearchTypeEnum) =>
		['directory', type, query] as const,
}

export function useDirectoryEntries(
	query: string,
	type: DirectorySearchTypeEnum,
): UseQueryResult<SearchResults, unknown> {
	return useQuery({
		queryKey: keys.all(query, type),
		queryFn: async ({queryKey: [_, type, query], signal}) => {
			let response = await directory
				.get('search', {searchParams: getDirectoryParams(query, type), signal})
				.json()
			return response as SearchResults
		},
		staleTime: 1000 * 60, // 1 minute
	})
}
