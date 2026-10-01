import type {StudentOrgType} from './types'
import {deburr, words} from '../../lib/text'
import {groupBy, memoize} from '@frogpond/collections'

/** The server adds the letter an org is listed under, which `StudentOrgType` doesn't declare. */
type GroupableOrg = StudentOrgType & {$groupableName?: string}

const splitToArray = memoize((str: string) => words(deburr(str.toLowerCase())))

const orgToArray = memoize((org: StudentOrgType) =>
	Array.from(
		new Set([
			...splitToArray(org.name),
			...splitToArray(org.category),
			...splitToArray(org.description),
		]),
	),
)

export type OrgSection = {title: string; data: StudentOrgType[]}

/**
 * Below this many results, a section per `$groupableName` group is mostly
 * empty boxes and an A-Z rail with nothing to jump between -- a single
 * untitled section reads better than sparse chrome.
 */
const FLAT_LIST_THRESHOLD = 15

/**
 * Search matches by word prefix across name/category/description, then
 * groups the results the same way the un-searched list already is: by the
 * server-provided `$groupableName` field (an alphabetization key that
 * strips leading articles, punctuation, etc. -- StudentOrgType does not
 * declare it because it is server enrichment the client only ever reads).
 *
 * A result set at or under `FLAT_LIST_THRESHOLD` skips grouping entirely and
 * comes back as one untitled section, so a small list renders flat instead of
 * as several sparsely-populated groups.
 */
export function filterAndGroupOrgs(orgs: StudentOrgType[], searchQuery: string): OrgSection[] {
	let normalizedQuery = searchQuery.toLowerCase()

	let results = !normalizedQuery
		? orgs
		: orgs.filter((org) => orgToArray(org).some((word) => word.startsWith(normalizedQuery)))

	if (results.length === 0) {
		return []
	}

	if (results.length <= FLAT_LIST_THRESHOLD) {
		return [{title: '', data: results}]
	}

	return Object.entries(groupBy(results, (org: GroupableOrg) => org.$groupableName)).map(
		([title, data]) => ({
			title,
			data,
		}),
	)
}
