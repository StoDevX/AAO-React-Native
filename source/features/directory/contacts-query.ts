import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {ContactType} from './types'
import type {CampusId} from '../../campuses'

/// Named apart from this feature's `keys`, in query.ts, which addresses the
/// St. Olaf directory search rather than these.
export const contactKeys = {
	/** Each campus's contacts sit under its id. */
	forCampus: (campusId: CampusId) => [campusId, 'contacts'] as const,
}

async function fetchContacts(campusId: CampusId, {signal}: {signal: AbortSignal}) {
	let response = await clientFor(campusId).get('contacts', {signal}).json()
	// The server sends whatever the data repo deployed, so this is an
	// assertion, not a check. `icon` in particular claims to be an SFSymbol on
	// no evidence; the tile falls back only when it is missing -- a wrong name
	// draws nothing, since SwiftUI's Image(systemName:) does not validate it.
	return (response as {data: ContactType[]}).data
}

// Contacts are hand-curated reference data (see data/contact-info/*.yaml) that
// changes on the order of weeks, not minutes. Without a staleTime, React
// Query's default (0) marks the cache stale immediately, so mounting the
// detail screen -- a second observer on the same queryKey -- triggers a
// background refetch on top of the one the grid already ran. A few minutes of
// staleness avoids that redundant request while still catching same-session
// edits.
const staleTime = 1000 * 60 * 5 // 5 minutes

/** The important contacts of the campus `campusId` names. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const contactsOptionsFor = (campusId: CampusId) =>
	queryOptions({
		queryKey: contactKeys.forCampus(campusId),
		queryFn: (context) => fetchContacts(campusId, context),
		staleTime,
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const contactByTitleOptions = (title: string, campusId: CampusId) =>
	queryOptions({
		queryKey: contactKeys.forCampus(campusId),
		queryFn: (context) => fetchContacts(campusId, context),
		select: (contacts) => contacts.find((c) => c.title === title),
		staleTime,
	})
