import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {StudentOrgType} from './types'

export const keys = {
	all: ['orgs'] as const,
}

// Student org data changes rarely (org listings are updated a handful of
// times per year) -- matches the 5-minute staleTime precedent set by
// Contacts' query.ts, avoiding a redundant background refetch every time
// someone opens an org's detail screen right after the list.
const staleTime = 1000 * 60 * 5

async function fetchStudentOrgs({signal}: {signal: AbortSignal}) {
	let response = await client.get('orgs', {signal}).json()
	return response as StudentOrgType[]
}

export const studentOrgsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchStudentOrgs,
	staleTime,
})

export const orgByNameOptions = (
	name: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchStudentOrgs,
		staleTime,
		select: (orgs) => orgs.find((org) => org.name === name),
	})
