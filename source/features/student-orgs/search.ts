import deburr from 'lodash/deburr'
import groupBy from 'lodash/groupBy'
import memoize from 'lodash/memoize'
import toPairs from 'lodash/toPairs'
import words from 'lodash/words'
import type {StudentOrgType} from './types'

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
 * Search matches by word prefix across name/category/description, then
 * groups the results the same way the un-searched list already is: by the
 * server-provided `$groupableName` field (an alphabetization key that
 * strips leading articles, punctuation, etc. -- StudentOrgType does not
 * declare it because it is server enrichment the client only ever reads).
 */
export function filterAndGroupOrgs(orgs: StudentOrgType[], searchQuery: string): OrgSection[] {
	let normalizedQuery = searchQuery.toLowerCase()

	let results = !normalizedQuery
		? orgs
		: orgs.filter((org) => orgToArray(org).some((word) => word.startsWith(normalizedQuery)))

	return toPairs(groupBy(results, '$groupableName')).map(([title, data]) => ({title, data}))
}
