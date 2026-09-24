import type {JobCategory, JobSummary} from '@frogpond/ccc-jobs'
import type {AreaStatus, StudentWorkArea} from '../areas'
import {
	areaSlugsFor,
	buildJobFilters,
	choosePosted,
	visibleSections,
	type FilterContext,
} from '../filters'

function job(id: string, title: string, postedDate = '2026-09-01'): JobSummary {
	return {id, title, postedDate, location: undefined}
}

const TODAY = new Date(2026, 8, 5, 12)

const MAIL = job('1', 'AY Mail Services Student Worker (WS-ST1)')
const CHEM_TA = job('2', 'F26 Chem Lab Student Teaching Assistant (WS-ST2)')
const STAV = job('3', 'AY Stav Student Supervisor (WS-NST3)')
const PAUSE = job('4', 'AY Lion’s Pause Student Technician (WS-OSA1)')
const CURI = job('5', 'CURI Academic Year Student Researcher - Braun')
const FOOTBALL = job('6', 'Football Student Filmer (WS-ST1)')
const SUMMER = job('7', 'Summer Physics Stockroom Student Assistant (WS-ST2)')
const OPERA = job('8', 'CURI Academic Year Student Researcher - Mináǧi Kiŋ Dowáŋ Opera (WS-NST2)')

const CATEGORIES: JobCategory[] = [
	{id: 1, name: 'Student Work', count: 6, jobs: [MAIL, CHEM_TA, STAV, PAUSE, CURI, FOOTBALL]},
	{id: 2, name: 'Summer Student Work', count: 1, jobs: [SUMMER]},
	{id: 3, name: 'Research', count: 1, jobs: [OPERA]},
]

const ALL_JOBS = CATEGORIES.flatMap((category) => category.jobs)

const NOTHING_CHOSEN = {area: null, posted: null, level: null, term: null}

const DINING: StudentWorkArea = {
	name: 'Dining',
	slug: 'dining',
	icon: 'fork.knife',
	gradient: ['#000', '#fff'],
	units: ['22005'],
}

const DINING_STATUS: AreaStatus = {
	ids: new Set(['1', '3']),
	count: 2,
	empty: false,
	settled: true,
	partial: false,
}

const FAITH: StudentWorkArea = {
	name: 'Faith',
	slug: 'faith',
	icon: 'sparkles',
	gradient: ['#000', '#fff'],
	units: ['45158'],
}

const FAITH_STATUS: AreaStatus = {
	ids: new Set(),
	count: 0,
	empty: true,
	settled: true,
	partial: false,
}

const CONTEXT: FilterContext = {
	areas: [DINING, FAITH],
	membership: new Map([
		['dining', DINING_STATUS],
		['faith', FAITH_STATUS],
	]),
	newIds: new Set(['4']),
	today: TODAY,
}

function filterNamed<T extends {spec: {title: string}}>(
	filters: T[],
	title: string,
): T | undefined {
	return filters.find((filter) => filter.spec.title === title)
}

function optionTitles(filter: {spec: {options: Array<{title: string}>}} | undefined): string[] {
	return filter?.spec.options.map((option) => option.title) ?? []
}

function ids(sections: Array<{data: JobSummary[]}>): string[] {
	return sections.flatMap((section) => section.data.map((posting) => posting.id))
}

describe('buildJobFilters', () => {
	test('offers the levels present, entry-level first', () => {
		let level = filterNamed(buildJobFilters([STAV, MAIL], NOTHING_CHOSEN, CONTEXT), 'Level')
		expect(level?.spec.title).toBe('Level')
		expect(optionTitles(level)).toEqual(['Entry-level', 'Lead'])
	})

	test('offers "Not stated" last, for a posting with no pay code', () => {
		let level = filterNamed(buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT), 'Level')
		expect(optionTitles(level)).toEqual(['Entry-level', 'Experienced', 'Lead', 'Not stated'])
	})

	test('offers the terms present, in calendar order', () => {
		let term = filterNamed(buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT), 'Term')
		expect(term?.spec.title).toBe('Term')
		expect(optionTitles(term)).toEqual(['Academic Year', 'Fall', 'Summer', 'Not stated'])
	})

	test('rests with nothing selected and nothing filtered', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT)
		expect(filters).toHaveLength(4)
		for (let filter of filters) {
			expect(filter.enabled).toBe(false)
			expect(filter.spec.selected).toEqual([])
		}
	})

	test('selects what the student chose', () => {
		let filters = buildJobFilters(ALL_JOBS, {...NOTHING_CHOSEN, level: ['Lead']}, CONTEXT)
		let level = filterNamed(filters, 'Level')
		let term = filterNamed(filters, 'Term')
		expect(level?.enabled).toBe(true)
		expect(level?.spec.selected).toEqual([{title: 'Lead'}])
		expect(term?.enabled).toBe(false)
	})

	test('offers no filters before any postings load', () => {
		expect(buildJobFilters([], NOTHING_CHOSEN, CONTEXT)).toEqual([])
	})
})

describe('visibleSections', () => {
	test('files every posting by how recently it went up', () => {
		let sections = visibleSections(
			CATEGORIES,
			buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT),
			'',
			CONTEXT,
		)
		expect(sections.map((section) => section.title)).toEqual(['This Week'])
		expect(ids(sections)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
	})

	test('orders the sections and the postings in them newest first', () => {
		let old = job('old', 'AY Archive Assistant (WS-ST1)', '2026-07-01')
		let lastWeek = job('last', 'AY Grader (WS-ST2)', '2026-08-26')
		let newer = job('newer', 'AY Tutor (WS-ST2)', '2026-09-04')
		let newest = job('newest', 'AY Usher (WS-ST1)', '2026-09-05')
		let categories: JobCategory[] = [
			{id: 1, name: 'Student Work', count: 3, jobs: [old, newer, lastWeek]},
			{id: 2, name: 'Summer Student Work', count: 1, jobs: [newest]},
		]
		let jobs = categories.flatMap((category) => category.jobs)

		let sections = visibleSections(
			categories,
			buildJobFilters(jobs, NOTHING_CHOSEN, CONTEXT),
			'',
			CONTEXT,
		)
		expect(sections.map((section) => [section.title, ids([section])])).toEqual([
			['This Week', ['newest', 'newer']],
			['Last Week', ['last']],
			['Earlier', ['old']],
		])
	})

	test('keeps postings at any chosen level', () => {
		let filters = buildJobFilters(
			ALL_JOBS,
			{...NOTHING_CHOSEN, level: ['Entry-level', 'Lead'], term: null},
			CONTEXT,
		)
		expect(ids(visibleSections(CATEGORIES, filters, '', CONTEXT))).toEqual(['1', '3', '4', '6'])
	})

	test('keeps postings in a chosen term', () => {
		let filters = buildJobFilters(
			ALL_JOBS,
			{...NOTHING_CHOSEN, level: null, term: ['Fall']},
			CONTEXT,
		)
		expect(ids(visibleSections(CATEGORIES, filters, '', CONTEXT))).toEqual(['2'])
	})

	test('keeps postings with no stated term when "Not stated" is chosen', () => {
		let filters = buildJobFilters(
			ALL_JOBS,
			{...NOTHING_CHOSEN, level: null, term: ['Not stated']},
			CONTEXT,
		)
		expect(ids(visibleSections(CATEGORIES, filters, '', CONTEXT))).toEqual(['6'])
	})

	test('requires a posting to match both filters', () => {
		let filters = buildJobFilters(
			ALL_JOBS,
			{...NOTHING_CHOSEN, level: ['Entry-level'], term: ['Academic Year']},
			CONTEXT,
		)
		expect(ids(visibleSections(CATEGORIES, filters, '', CONTEXT))).toEqual(['1', '4'])
	})

	test('drops a section the filters empty', () => {
		let lastWeek = job('last', 'Summer Grader (WS-ST2)', '2026-08-26')
		let categories: JobCategory[] = [
			{id: 1, name: 'Student Work', count: 2, jobs: [MAIL, lastWeek]},
		]
		let filters = buildJobFilters([MAIL, lastWeek], {...NOTHING_CHOSEN, term: ['Summer']}, CONTEXT)
		expect(
			visibleSections(categories, filters, '', CONTEXT).map((section) => section.title),
		).toEqual(['Last Week'])
	})

	test('searches the start of each word in the title', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT)
		expect(ids(visibleSections(CATEGORIES, filters, 'stock', CONTEXT))).toEqual(['7'])
		expect(ids(visibleSections(CATEGORIES, filters, 'ock', CONTEXT))).toEqual([])
	})

	test('requires every word of the search, in any order', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT)
		expect(ids(visibleSections(CATEGORIES, filters, 'assistant chem', CONTEXT))).toEqual(['2'])
	})

	test('ignores case and apostrophes in the search', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT)
		expect(ids(visibleSections(CATEGORIES, filters, 'LIONS pause', CONTEXT))).toEqual(['4'])
	})

	// lodash's `deburr` leaves letters like ǧ and ŋ alone; a live CURI title
	// has both.
	test('ignores accents beyond Latin-1 in the search', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT)
		expect(ids(visibleSections(CATEGORIES, filters, 'minagi kin', CONTEXT))).toEqual(['8'])
	})

	test('does not match the term prefix or pay code a student never sees', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT)
		expect(ids(visibleSections(CATEGORIES, filters, 'ws', CONTEXT))).toEqual([])
		expect(ids(visibleSections(CATEGORIES, filters, 'f26', CONTEXT))).toEqual([])
	})

	test('searches within the filtered postings', () => {
		let filters = buildJobFilters(
			ALL_JOBS,
			{...NOTHING_CHOSEN, level: ['Entry-level'], term: null},
			CONTEXT,
		)
		expect(ids(visibleSections(CATEGORIES, filters, 'student', CONTEXT))).toEqual(['1', '4', '6'])
	})

	test('keeps postings in a chosen area', () => {
		let filters = buildJobFilters(ALL_JOBS, {...NOTHING_CHOSEN, area: ['dining']}, CONTEXT)
		expect(ids(visibleSections(CATEGORIES, filters, '', CONTEXT))).toEqual(['1', '3'])
	})

	test('keeps postings new since the last visit', () => {
		let filters = buildJobFilters(
			ALL_JOBS,
			{...NOTHING_CHOSEN, posted: ['New since last visit']},
			CONTEXT,
		)
		expect(ids(visibleSections(CATEGORIES, filters, '', CONTEXT))).toEqual(['4'])
	})
})

describe('the Area and Posted filters', () => {
	test('leave out an old posting the student has seen when Posted is chosen', () => {
		let old = job('old', 'AY Archive Assistant (WS-ST1)', '2026-06-01')
		let categories: JobCategory[] = [{id: 1, name: 'Student Work', count: 2, jobs: [MAIL, old]}]
		let filters = buildJobFilters(
			[MAIL, old],
			{...NOTHING_CHOSEN, posted: ['Last 30 days']},
			CONTEXT,
		)
		expect(ids(visibleSections(categories, filters, '', CONTEXT))).toEqual(['1'])
	})

	test('come before Level and Term', () => {
		expect(buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT).map((f) => f.spec.title)).toEqual([
			'Area',
			'Posted',
			'Level',
			'Term',
		])
	})

	// An empty area's tile still opens, to a list filtered to that area.
	test('offer every area whose searches have answered, empty ones too', () => {
		let area = filterNamed(buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT), 'Area')
		expect(optionTitles(area)).toEqual(['Dining', 'Faith'])
	})

	test('show nothing for an empty area', () => {
		let filters = buildJobFilters(ALL_JOBS, {...NOTHING_CHOSEN, area: ['faith']}, CONTEXT)
		expect(ids(visibleSections(CATEGORIES, filters, '', CONTEXT))).toEqual([])
	})

	test('offer no areas before the unit searches answer', () => {
		let area = filterNamed(
			buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, {...CONTEXT, membership: new Map()}),
			'Area',
		)
		expect(optionTitles(area)).toEqual([])
	})

	test('offer the Posted choices some posting has', () => {
		let posted = filterNamed(buildJobFilters(ALL_JOBS, NOTHING_CHOSEN, CONTEXT), 'Posted')
		expect(optionTitles(posted)).toEqual(['Last 30 days', 'New since last visit'])
	})
})

describe('a prefilled choice nothing matches', () => {
	// A preset opens the list with its choice made; when nothing has that value
	// -- no new postings on a first visit, no summer jobs in September -- the
	// list has to say so, not drop the choice and show everything.
	test('keeps a Posted choice nothing has, and shows nothing', () => {
		let context = {...CONTEXT, newIds: new Set<string>()}
		let filters = buildJobFilters(
			ALL_JOBS,
			{...NOTHING_CHOSEN, posted: ['New since last visit']},
			context,
		)
		expect(filterNamed(filters, 'Posted')?.enabled).toBe(true)
		expect(ids(visibleSections(CATEGORIES, filters, '', context))).toEqual([])
	})

	test('keeps a Term choice nothing has, and shows nothing', () => {
		let filters = buildJobFilters([MAIL, STAV], {...NOTHING_CHOSEN, term: ['Spring']}, CONTEXT)
		expect(filterNamed(filters, 'Term')?.enabled).toBe(true)
		let categories: JobCategory[] = [{id: 1, name: 'Student Work', count: 2, jobs: [MAIL, STAV]}]
		expect(ids(visibleSections(categories, filters, '', CONTEXT))).toEqual([])
	})
})

describe('areaSlugsFor', () => {
	test('turns the Area filter’s titles back into slugs', () => {
		expect(areaSlugsFor(['Faith', 'Dining'], [DINING, FAITH])).toEqual(['faith', 'dining'])
	})

	test('drops a title no area has', () => {
		expect(areaSlugsFor(['Gone'], [DINING, FAITH])).toEqual([])
	})
})

describe('a chosen area keyed by slug', () => {
	// The published file can rename an area while a list is open; the slug
	// is what the tile opened, so the choice follows the rename.
	test('still selects an area the live file has renamed', () => {
		let renamed = {...CONTEXT, areas: [{...DINING, name: 'Dining & BonApp'}, FAITH]}
		let filters = buildJobFilters(ALL_JOBS, {...NOTHING_CHOSEN, area: ['dining']}, renamed)
		expect(filterNamed(filters, 'Area')?.spec.selected).toEqual([{title: 'Dining & BonApp'}])
		expect(ids(visibleSections(CATEGORIES, filters, '', renamed))).toEqual(['1', '3'])
	})
})

describe('choosePosted', () => {
	test('keeps only the newest choice', () => {
		expect(choosePosted(['Last 30 days'], ['Last 30 days', 'New since last visit'])).toEqual([
			'New since last visit',
		])
	})

	test('clears when the choice is unticked', () => {
		expect(choosePosted(['Last 30 days'], [])).toEqual([])
	})
})
