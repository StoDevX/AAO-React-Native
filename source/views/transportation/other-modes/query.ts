import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {groupBy, toPairs} from 'lodash'
import {OtherModeType} from '../types'

export const keys = {
	all: ['transit', 'modes'] as const,
}

export function useOtherModes(): UseQueryResult<OtherModeType[], unknown> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('transit/modes', {signal}).json()
			return response as OtherModeType[]
		},
	})
}

export function useOtherModesGrouped(): UseQueryResult<
	{title: string; data: OtherModeType[]}[],
	unknown
> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('transit/modes', {signal}).json()
			return response as OtherModeType[]
		},
		select: (modes) => {
			let grouped = groupBy(modes, (m) => m.category)
			return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
		},
	})
}
