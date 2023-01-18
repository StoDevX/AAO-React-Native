import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {StudentOrgType} from './types'

export const keys = {
	all: ['orgs'] as const,
}

export function useStudentOrgs(): UseQueryResult<StudentOrgType[], unknown> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('/transit/bus', {signal}).json()
			return response as StudentOrgType[]
		},
	})
}
