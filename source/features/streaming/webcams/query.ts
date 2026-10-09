import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {Webcam} from './types'

export const keys = {
	all: ['streaming', 'webcams'] as const,
}

export const webcamsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		// St. Olaf's server: only St. Olaf's Home offers webcams.
		let response = await clientFor('edu.stolaf').get('webcams', {signal}).json()
		return (response as {data: Webcam[]}).data
	},
})
