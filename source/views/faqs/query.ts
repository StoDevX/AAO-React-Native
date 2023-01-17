import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'

export const keys = {
	all: ['faqs'] as const,
}

export function useFaqs(): UseQueryResult<{text: string}, unknown> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('/faqs', {signal}).json()
			return response as {text: string}
		},
	})
}
