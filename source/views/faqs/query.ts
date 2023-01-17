import {client} from '@frogpond/api'
import {useQuery} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'

export const keys = {
	all: ['faqs'] as const,
}

queryClient.setQueryData(keys.all, require('../../docs/faqs.json'))

export async function fetchFaqs() {
	let response = await client.get('/faqs').json()
	return (response as {text: string})
}

export function useFaqs() {
	return useQuery({
		queryKey: keys.all,
		queryFn: fetchFaqs,
	})
}
