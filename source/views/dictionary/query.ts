import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {WordType} from './types'

export const keys = {
	all: ['dictionary'] as const,
}

export const dictionaryOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('dictionary', {signal}).json()
		return (response as {data: WordType[]}).data
	},
})
