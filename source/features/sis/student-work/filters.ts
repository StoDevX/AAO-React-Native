import type {JobCategory, JobSummary} from '@frogpond/ccc-jobs'
// Deep imports: the package's index also exports the toolbar, whose native
// views Jest cannot load.
import {applyFiltersToItem} from '@frogpond/filter/apply-filters'
import {selectedOptions} from '@frogpond/filter/selected-options'
import type {ListType} from '@frogpond/filter/types'
import deburr from 'lodash/deburr'
import words from 'lodash/words'
import {displayTitle, jobCode, jobTerm, type JobTerm, type PayTier} from './posting'

/// What the Level and Term filters match a posting on.
export type JobFacets = {level: string; term: string}

/// The options the student picked in each filter; `null` is untouched.
export type ChosenJobFilters = {level: string[] | null; term: string[] | null}

export type JobSection = {title: string; data: JobSummary[]}

const NOT_STATED = 'Not stated'

const LEVELS: Record<PayTier, string> = {1: 'Entry-level', 2: 'Experienced', 3: 'Lead'}
const LEVEL_ORDER = [LEVELS[1], LEVELS[2], LEVELS[3], NOT_STATED]

const TERM_ORDER: Array<JobTerm | typeof NOT_STATED> = [
	'Academic Year',
	'Fall',
	'Spring',
	'Summer',
	NOT_STATED,
]

function facetsOf(job: JobSummary): JobFacets {
	let code = jobCode(job.title)
	return {
		level: code ? LEVELS[code.tier] : NOT_STATED,
		term: jobTerm(job.title) ?? NOT_STATED,
	}
}

function listFilter(
	key: keyof JobFacets,
	title: string,
	order: string[],
	present: Set<string>,
	chosen: string[] | null,
): ListType<JobFacets> {
	let options = order.filter((value) => present.has(value)).map((value) => ({title: value}))
	let selected = selectedOptions(options, chosen)

	return {
		type: 'list',
		key,
		// Selecting nothing is the resting state and shows everything.
		enabled: selected.length > 0,
		spec: {title, options, selected, presentation: 'menu', mode: 'OR', displayTitle: true},
		apply: {key},
	}
}

/// The Level and Term filters, offering only the values some posting has.
export function buildJobFilters(
	jobs: JobSummary[],
	chosen: ChosenJobFilters,
): ListType<JobFacets>[] {
	if (jobs.length === 0) return []

	let facets = jobs.map(facetsOf)

	return [
		listFilter('level', 'Level', LEVEL_ORDER, new Set(facets.map((f) => f.level)), chosen.level),
		listFilter('term', 'Term', TERM_ORDER, new Set(facets.map((f) => f.term)), chosen.term),
	]
}

/// Lowercased words with accents and apostrophes gone, so "lions" finds
/// "Lion’s".
function searchWords(text: string): string[] {
	return words(deburr(text.toLowerCase().replaceAll(/['’]/gu, '')))
}

/// Every word of the query has to start some word of the title the student
/// sees -- not the term prefix or pay code, which are hidden from them.
function matchesSearch(job: JobSummary, queryWords: string[]): boolean {
	let titleWords = searchWords(displayTitle(job.title))
	return queryWords.every((query) => titleWords.some((word) => word.startsWith(query)))
}

/// The categories' postings that pass the filters and the search, dropping any
/// category left empty.
export function visibleSections(
	categories: JobCategory[],
	filters: ListType<JobFacets>[],
	query: string,
): JobSection[] {
	let queryWords = searchWords(query)

	return categories
		.map((category) => ({
			title: category.name,
			data: category.jobs.filter(
				(job) => applyFiltersToItem(filters, facetsOf(job)) && matchesSearch(job, queryWords),
			),
		}))
		.filter((section) => section.data.length > 0)
}
