import {client} from '@frogpond/api'
import {useQuery} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {WordType} from './types'

export const keys = {
	all: ['dictionary'] as const,
}

queryClient.setQueryData(keys.all, require('../../docs/dictionary.json'))

export function useDictionary() {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('/dictionary', {signal}).json()
			return (response as {data: WordType[]}).data
		},
	})
}
