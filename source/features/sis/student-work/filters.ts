import type {JobCategory, JobSummary} from '@frogpond/ccc-jobs'
// Deep imports: the package's index also exports the toolbar, whose native
// views Jest cannot load.
import {applyFiltersToItem} from '@frogpond/filter/apply-filters'
import {selectedOptions} from '@frogpond/filter/selected-options'
import type {ListType} from '@frogpond/filter/types'
import deburr from 'lodash/deburr'
import words from 'lodash/words'
import type {AreaStatus, StudentWorkArea} from './areas'
import {displayTitle, jobCode, jobTerm, LEVEL_LABELS, type JobTerm} from './posting'
import {POSTED_NEW, POSTED_RECENT, postedTags} from './presets'
import {recencyOf, RECENCY_ORDER} from './recency'

/// What the filters match a posting on.
export type JobFacets = {area: string[]; posted: string[]; level: string; term: string}

/// What a posting's level and term are; worked out from its title alone.
type TitleFacets = Pick<JobFacets, 'level' | 'term'>

/// The options the student picked in each filter; `null` is untouched.
export type ChosenJobFilters = {
	area: string[] | null
	posted: string[] | null
	level: string[] | null
	term: string[] | null
}

/// What the Area and Posted filters need beyond the postings themselves.
export type FilterContext = {
	areas: StudentWorkArea[]
	/// Each area's postings, keyed by slug; see `areaMembership`.
	membership: Map<string, AreaStatus>
	/// The postings the student had not seen when they last left Student Work.
	newIds: Set<string>
	today: Date
}

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
const facetsCache = new WeakMap<JobSummary, TitleFacets>()
const titleWordsCache = new WeakMap<JobSummary, string[]>()

function facetsOf(job: JobSummary): TitleFacets {
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

/// A posting's areas and Posted values depend on the unit searches and the
/// seen set, which change without the posting changing, so they are not cached.
function fullFacetsOf(job: JobSummary, context: FilterContext): JobFacets {
	let area = context.areas
		.filter((candidate) => context.membership.get(candidate.slug)?.ids.has(job.id))
		.map((candidate) => candidate.name)
	let posted = postedTags(job, context.newIds, context.today)

	// @frogpond/filter lets an empty list through every list filter, so a
	// posting in no area, or neither recent nor new, says "Not stated" --
	// which neither filter offers as an option, so it never matches a choice.
	return {
		...facetsOf(job),
		area: area.length > 0 ? area : [NOT_STATED],
		posted: posted.length > 0 ? posted : [NOT_STATED],
	}
}

function listFilter(
	key: keyof JobFacets,
	title: string,
	order: string[],
	present: Set<string>,
	chosen: string[] | null,
	presentation: 'menu' | 'sheet' = 'menu',
): ListType<JobFacets> {
	// A chosen value stays on offer even when nothing has it: a preset opens
	// the list with its choice made, and a choice dropped for matching nothing
	// would show every posting instead of saying none match.
	let offered = (value: string) => present.has(value) || (chosen ?? []).includes(value)
	let options = order.filter(offered).map((value) => ({title: value}))
	let selected = selectedOptions(options, chosen)

	return {
		type: 'list',
		key,
		// Selecting nothing is the resting state and shows everything.
		enabled: selected.length > 0,
		spec: {title, options, selected, presentation, mode: 'OR', displayTitle: true},
		apply: {key},
	}
}

/// The Area, Posted, Level, and Term filters, each offering only the values
/// some posting has.
export function buildJobFilters(
	jobs: JobSummary[],
	chosen: ChosenJobFilters,
	context: FilterContext,
): ListType<JobFacets>[] {
	if (jobs.length === 0) return []

	let facets = jobs.map((job) => fullFacetsOf(job, context))
	let areaOrder = context.areas.map((area) => area.name)
	// Every area whose searches have answered, empty ones too: an empty
	// area's tile still opens, to a list filtered to it that says so.
	let knownAreas = new Set(
		context.areas
			.filter((area) => context.membership.get(area.slug)?.count !== undefined)
			.map((area) => area.name),
	)

	return [
		// Sixteen areas are too many rows for a pull-down menu.
		listFilter('area', 'Area', areaOrder, knownAreas, chosen.area, 'sheet'),
		listFilter(
			'posted',
			'Posted',
			[POSTED_RECENT, POSTED_NEW],
			new Set(facets.flatMap((f) => f.posted)),
			chosen.posted,
		),
		listFilter('level', 'Level', LEVEL_ORDER, new Set(facets.map((f) => f.level)), chosen.level),
		listFilter('term', 'Term', TERM_ORDER, new Set(facets.map((f) => f.term)), chosen.term),
	]
}

/// Posted is one choice at a time: the list filter reports every ticked
/// option, so keep only the one just added.
export function choosePosted(previous: string[] | null, next: string[]): string[] {
	let added = next.filter((title) => !(previous ?? []).includes(title))
	return added.length > 0 ? added.slice(-1) : next.slice(-1)
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

/// The postings that pass the filters and the search, sectioned by how
/// recently they went up and newest first, dropping any section left empty.
///
/// Oracle's own categories are not the sections: nearly every posting is in
/// "Student Work", and the Term filter already sorts out the summer ones.
export function visibleSections(
	categories: JobCategory[],
	filters: ListType<JobFacets>[],
	query: string,
	context: FilterContext,
): JobSection[] {
	let queryWords = searchWords(query)

	let visible = categories
		.flatMap((category) => category.jobs)
		.filter(
			(job) =>
				applyFiltersToItem(filters, fullFacetsOf(job, context)) && matchesSearch(job, queryWords),
		)

	// `PostedDate` is `YYYY-MM-DD`, so the strings sort as the dates do. A
	// copy and `sort`, not `toSorted`, which Hermes lacks.
	let newestFirst = [...visible].sort((a, b) => b.postedDate.localeCompare(a.postedDate))

	return RECENCY_ORDER.map((recency) => ({
		title: recency,
		data: newestFirst.filter((job) => recencyOf(job.postedDate, context.today) === recency),
	})).filter((section) => section.data.length > 0)
}
