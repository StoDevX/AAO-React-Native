import ky from 'ky'
import {useQuery} from '@tanstack/react-query'
import {DirectorySearchTypeEnum, SearchResults} from './types'

let directory = ky.create({prefixUrl: 'https://www.stolaf.edu/directory'})

const getDirectoryParams = (query: string, type: DirectorySearchTypeEnum) => {
	let p = new URLSearchParams()
	p.set('format', 'json')

	switch (type) {
		case 'department':
			p.set('department', query.trim())
			break
		case 'firstName':
			p.set('firstname', query.trim())
			break
		case 'lastName':
			p.set('lastname', query.trim())
			break
		case 'major':
			p.set('major', query.trim())
			break
		case 'query':
			p.set('query', query.trim())
			break
		case 'title':
			p.set('title', query.trim())
			break
		case 'username':
			p.set('email', query.trim())
			break
		default:
			let _neverHitMe: never = type
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
) {
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
