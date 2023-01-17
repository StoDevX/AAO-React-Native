import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {WordType} from './types'

export const keys = {
	all: ['dictionary'] as const,
}

export function useDictionary(): UseQueryResult<WordType[], unknown> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('/dictionary', {signal}).json()
			return (response as {data: WordType[]}).data
		},
	})
}
