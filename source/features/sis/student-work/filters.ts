import type {JobCategory, JobSummary} from '@frogpond/ccc-jobs'
// Deep imports: the package's index also exports the toolbar, whose native
// views Jest cannot load.
import {applyFiltersToItem} from '@frogpond/filter/apply-filters'
import {selectedOptions} from '@frogpond/filter/selected-options'
import type {ListType} from '@frogpond/filter/types'
import deburr from 'lodash/deburr'
import words from 'lodash/words'
import {displayTitle, jobCode, jobTerm, LEVEL_LABELS, type JobTerm} from './posting'

/// What the Level and Term filters match a posting on.
export type JobFacets = {level: string; term: string}

/// The options the student picked in each filter; `null` is untouched.
export type ChosenJobFilters = {level: string[] | null; term: string[] | null}

export type JobSection = {title: string; data: JobSummary[]}

const NOT_STATED = 'Not stated'

const LEVEL_ORDER = [LEVEL_LABELS[1], LEVEL_LABELS[2], LEVEL_LABELS[3], NOT_STATED]

const TERM_ORDER: Array<JobTerm | typeof NOT_STATED> = [
	'Academic Year',
	'Fall',
	'Spring',
	'Summer',
	NOT_STATED,
]

/// Each posting's facets and title words, worked out once per posting rather
/// than on every search or filter change. Keyed by the posting object, so a
/// refetch's new objects start fresh and old ones are let go.
const facetsCache = new WeakMap<JobSummary, JobFacets>()
const titleWordsCache = new WeakMap<JobSummary, string[]>()

function facetsOf(job: JobSummary): JobFacets {
	let cached = facetsCache.get(job)
	if (cached) return cached

	let code = jobCode(job.title)
	let facets = {
		level: code ? LEVEL_LABELS[code.tier] : NOT_STATED,
		term: jobTerm(job.title) ?? NOT_STATED,
	}
	facetsCache.set(job, facets)
	return facets
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

const COMBINING_MARKS = /\p{M}/gu

/// Lowercased words with accents and apostrophes gone, so "lions" finds
/// "Lion’s" and "minagi kin" finds "Mináǧi Kiŋ". Dropping the marks after
/// decomposing reaches accented letters `deburr` leaves alone, like ǧ, and
/// `deburr` maps the letters that have no decomposition, like ŋ.
function searchWords(text: string): string[] {
	let unmarked = text.toLowerCase().normalize('NFD').replaceAll(COMBINING_MARKS, '')
	return words(deburr(unmarked.replaceAll(/['’]/gu, '')))
}

function titleWordsOf(job: JobSummary): string[] {
	let cached = titleWordsCache.get(job)
	if (cached) return cached

	let titleWords = searchWords(displayTitle(job.title))
	titleWordsCache.set(job, titleWords)
	return titleWords
}

/// Every word of the query has to start some word of the title the student
/// sees -- not the term prefix or pay code, which are hidden from them.
function matchesSearch(job: JobSummary, queryWords: string[]): boolean {
	let titleWords = titleWordsOf(job)
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
