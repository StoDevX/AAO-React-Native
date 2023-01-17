import {client} from '@frogpond/api'
import {useQuery} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {LinkGroup} from './types'

export const keys = {
	all: ['a-z'] as const,
}

queryClient.setQueryData(keys.all, require('../../docs/a-to-z.json'))

export function useSearchLinks() {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('/a-to-z', {signal}).json()
			return (response as {data: LinkGroup[]}).data
		},
	})
}
