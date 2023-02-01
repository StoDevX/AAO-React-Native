import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import { groupBy } from 'lodash'
import {DictionaryGroup, RawWordType, WordType} from './types'

export const keys = {
	all: ['dictionary'] as const,
}

function groupWords(words: RawWordType[]): WordType[] {
	return words.map((w) => ({
		...w,
		key: w.word[0],
	}))
}

export function useDictionary(): UseQueryResult<WordType[], Error> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('dictionary', {signal}).json()
			return (response as {data: WordType[]}).data
		},
		select: groupWords,
	})
}
