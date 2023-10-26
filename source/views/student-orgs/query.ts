import {client} from '@frogpond/api'

import {StudentOrgType} from './types'
import {useQuery, UseQueryResult} from '@tanstack/react-query'

export const keys = {
	all: ['orgs'] as const,
}

export function useStudentOrgs(): UseQueryResult<StudentOrgType[], unknown> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('orgs', {signal}).json()
			return response as StudentOrgType[]
		},
	})
}
