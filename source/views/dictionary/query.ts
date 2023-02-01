import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import { groupBy } from 'lodash'
import {DictionaryGroup, WordType} from './types'

export const keys = {
	all: ['dictionary'] as const,
}

function groupWords(words: WordType[]): DictionaryGroup[] {
	let grouped = groupBy(words, (w) => w.word[0] || '?')
	return Object.entries(grouped).map(([k, v]) => ({
		title: k,
		data: v,
	}))
}

export function useDictionary(): UseQueryResult<DictionaryGroup[], Error> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('dictionary', {signal}).json()
			return (response as {data: WordType[]}).data
		},
		select: groupWords,
	})
}
