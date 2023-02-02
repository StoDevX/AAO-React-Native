import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {RawStudentOrgType, StudentOrgType} from './types'

export const keys = {
	all: ['orgs'] as const,
}

function processOrgs(orgs: RawStudentOrgType[]): StudentOrgType[] {
	return orgs.map((o) => ({
		...o,
		key: `n=${o.name} c=${o.category}`,
	}))
}

export function useStudentOrgs(): UseQueryResult<StudentOrgType[], Error> {
	return useQuery({
		queryKey: keys.all,
		queryFn: async ({signal}) => {
			let response = await client.get('orgs', {signal}).json()
			return response as StudentOrgType[]
		},
		select: processOrgs,
	})
}
