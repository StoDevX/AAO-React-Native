import {queryOptions} from '@tanstack/react-query'
import {Webcam} from './types'
import {clientForSection} from '../../campus/section-client'

export const keys = {
	all: ['streaming', 'webcams'] as const,
}

export const webcamsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await clientForSection('streaming').get('webcams', {signal}).json()
		return (response as {data: Webcam[]}).data
	},
})
