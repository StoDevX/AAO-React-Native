import ky from 'ky'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {DirectorySearchTypeEnum, SearchResults} from './types'

let directory = ky.create({prefixUrl: 'https://www.stolaf.edu/directory'})

const getDirectoryParams = (query: string, type: DirectorySearchTypeEnum) => {
	let p = new URLSearchParams()
	p.set('format', 'json')

	query = query.trim()

	switch (type) {
		case 'department':
			p.set('department', query)
			break
		case 'firstName':
			p.set('firstname', query)
			break
		case 'lastName':
			p.set('lastname', query)
			break
		case 'major':
			p.set('major', query)
			break
		case 'query':
			p.set('query', query)
			break
		case 'title':
			p.set('title', query)
			break
		case 'username':
			p.set('email', query)
			break
		default: {
			let _neverHitMe: never = type
		}
	}

	return p
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
				.get('/search', {searchParams: getDirectoryParams(query, type), signal})
				.json()
			return response as SearchResults
		},
		staleTime: 1000 * 60, // 1 minute
	})
}
