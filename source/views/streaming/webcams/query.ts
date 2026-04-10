import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {Webcam} from './types'

export const keys = {
	all: ['streaming', 'webcams'] as const,
}

export const webcamsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('webcams', {signal}).json()
		return (response as {data: Webcam[]}).data
	},
})
