import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {DepartmentListing} from './types'
import type {CampusId} from '../../campuses'

/// `directory`-prefixed to stand apart from `keys` in query.ts (the directory
/// search). Course search's department filter lists catalog subject codes, a
/// different list for a different screen.
export const directoryDepartmentKeys = {
	forServer: (server: CampusId) => [server, 'directory', 'departments'] as const,
}

async function fetchDepartments(server: CampusId, {signal}: {signal: AbortSignal}) {
	let response = await clientFor(server).get('directory/departments', {signal}).json()
	// The server returns whatever the directory deployed; this is an assertion,
	// not a check. Only `name` is consumed downstream.
	return (response as {results: DepartmentListing[]}).results
}

// The campus department roster changes on the order of once a semester. A day
// of staleness never leaves a session looking at a list that shifted under it,
// and spares a refetch every time the landing remounts.
const staleTime = 1000 * 60 * 60 * 24 // 1 day

/** The departments on `server`, the directory campus's server. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const directoryDepartmentsOptions = (server: CampusId) =>
	queryOptions({
		queryKey: directoryDepartmentKeys.forServer(server),
		queryFn: (context) => fetchDepartments(server, context),
		staleTime,
		// The endpoint is already alphabetical, but the inset-grouped list depends
		// on the order, so sort rather than trust it.
		select: (rows: DepartmentListing[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name)),
	})
