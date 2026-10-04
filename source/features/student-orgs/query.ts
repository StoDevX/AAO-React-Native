import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import type {StudentOrgDetailType, StudentOrgType} from './types'

export const keys = {
	all: ['orgs'] as const,
}

// Student org data changes rarely (org listings are updated a handful of
// times per year) -- matches the 5-minute staleTime precedent set by
// directory/contacts-query.ts, avoiding a redundant background refetch every
// time someone opens an org's detail screen right after the list.
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

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const orgByNameOptions = (name: string) =>
	queryOptions({
		queryKey: keys.all,
		queryFn: fetchStudentOrgs,
		staleTime,
		select: (orgs) => orgs.find((org) => org.name === name),
	})

async function fetchOrgDetail(uri: string, {signal}: {signal: AbortSignal}) {
	let response = await client.get(`orgs/uri/${encodeURIComponent(uri)}`, {signal}).json()
	return response as StudentOrgDetailType
}

/**
 * The fields only an org's own Presence pages hold -- contacts, advisors,
 * links -- for its detail screen. The server reads them from a page too slow
 * to fetch for every org at once, so the screen asks for them one org at a
 * time and shows what `/orgs` already gave it meanwhile. No retries: a server
 * without the route answers 404, and the screen simply goes without.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const orgDetailOptions = (uri: string) =>
	queryOptions({
		queryKey: [...keys.all, 'detail', uri] as const,
		queryFn: ({signal}) => fetchOrgDetail(uri, {signal}),
		staleTime,
		retry: false,
	})
