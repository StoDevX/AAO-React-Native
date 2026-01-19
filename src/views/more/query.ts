import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'

export interface LinkGroup {
	title: string
	data: LinkValue[]
}

export interface LinkValue {
	label: string
	url: string
}

export const keys = {
	all: ['a-z'] as const,
}

export function useSearchLinks(): UseQueryResult<LinkGroup[], unknown> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('a-to-z', {signal}).json()
			return response as LinkGroup[]
		},
	})
}
