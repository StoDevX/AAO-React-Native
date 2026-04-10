import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {StudentOrgType} from './types'

export const keys = {
	all: ['orgs'] as const,
}

export const studentOrgsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('orgs', {signal}).json()
		return response as StudentOrgType[]
	},
})
