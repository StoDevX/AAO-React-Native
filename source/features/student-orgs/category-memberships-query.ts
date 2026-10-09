import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import type {OrgCategoryMembership} from './types'

export const keys = {
	all: ['org-category-memberships'] as const,
}

// Matches studentOrgsOptions' staleTime -- membership data moves at the same
// pace the org list itself does.
const staleTime = 1000 * 60 * 5

async function fetchCategoryMemberships({
	signal,
}: {
	signal: AbortSignal
}): Promise<OrgCategoryMembership[]> {
	// St. Olaf's server: only St. Olaf's Home offers student orgs.
	let response = await clientFor('edu.stolaf').get('orgs/categories', {signal}).json()
	return response as OrgCategoryMembership[]
}

export const categoryMembershipsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchCategoryMemberships,
	staleTime,
})
