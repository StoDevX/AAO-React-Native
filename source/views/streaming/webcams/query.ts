import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {Webcam} from './types'

export const keys = {
	all: ['streaming', 'webcams'] as const,
}

export function useWebcams(): UseQueryResult<Webcam[], unknown> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('webcams', {signal}).json()
			return response as Webcam[]
		},
	})
}
