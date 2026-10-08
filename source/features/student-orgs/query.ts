import {stolafClient} from '@frogpond/api'
import {isUITesting} from '@frogpond/launch-arguments'
import {isHTTPError} from 'ky'
import {queryOptions} from '@tanstack/react-query'
import type {StudentOrgDetailType, StudentOrgType} from './types'
import uitestOrgs from './fixtures/uitest-orgs.json'

export const keys = {
	all: ['orgs'] as const,
}

// Student org data changes rarely (org listings are updated a handful of
// times per year) -- matches the 5-minute staleTime precedent set by
// directory/contacts-query.ts, avoiding a redundant background refetch every
// time someone opens an org's detail screen right after the list.
const staleTime = 1000 * 60 * 5

async function fetchStudentOrgs({signal}: {signal: AbortSignal}) {
	// UI tests read a recorded list, so a search's results are as long, and
	// in the order, the tests expect, whatever Presence.io holds today.
	if (isUITesting) {
		return uitestOrgs as StudentOrgType[]
	}
	let response = await stolafClient.get('orgs', {signal}).json()
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

/// `null` where the server has no such route yet, or no such org: the screen
/// shows what `/orgs` gave it, and nothing went wrong.
async function fetchOrgDetail(
	uri: string,
	{signal}: {signal: AbortSignal},
): Promise<StudentOrgDetailType | null> {
	try {
		let response = await stolafClient.get(`orgs/uri/${encodeURIComponent(uri)}`, {signal}).json()
		return response as StudentOrgDetailType
	} catch (error) {
		if (isHTTPError(error) && error.response.status === 404) {
			return null
		}
		throw error
	}
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
		// Its own head, so a failure here is not reported as the org list's.
		queryKey: ['org-detail', uri] as const,
		queryFn: ({signal}) => fetchOrgDetail(uri, {signal}),
		staleTime,
		retry: false,
	})
