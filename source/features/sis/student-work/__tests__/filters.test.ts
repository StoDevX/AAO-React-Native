import type {JobCategory, JobSummary} from '@frogpond/ccc-jobs'
import {buildJobFilters, visibleSections} from '../filters'

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

const NOTHING_CHOSEN = {level: null, term: null}

function optionTitles(filter: {spec: {options: Array<{title: string}>}} | undefined): string[] {
	return filter?.spec.options.map((option) => option.title) ?? []
}

function ids(sections: Array<{data: JobSummary[]}>): string[] {
	return sections.flatMap((section) => section.data.map((posting) => posting.id))
}

describe('buildJobFilters', () => {
	test('offers the levels present, entry-level first', () => {
		let [level] = buildJobFilters([STAV, MAIL], NOTHING_CHOSEN)
		expect(level?.spec.title).toBe('Level')
		expect(optionTitles(level)).toEqual(['Entry-level', 'Lead'])
	})

	test('offers "Not stated" last, for a posting with no pay code', () => {
		let [level] = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN)
		expect(optionTitles(level)).toEqual(['Entry-level', 'Experienced', 'Lead', 'Not stated'])
	})

	test('offers the terms present, in calendar order', () => {
		let [, term] = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN)
		expect(term?.spec.title).toBe('Term')
		expect(optionTitles(term)).toEqual(['Academic Year', 'Fall', 'Summer', 'Not stated'])
	})

	test('rests with nothing selected and nothing filtered', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN)
		expect(filters).toHaveLength(2)
		for (let filter of filters) {
			expect(filter.enabled).toBe(false)
			expect(filter.spec.selected).toEqual([])
		}
	})

	test('selects what the student chose', () => {
		let [level, term] = buildJobFilters(ALL_JOBS, {level: ['Lead'], term: null})
		expect(level?.enabled).toBe(true)
		expect(level?.spec.selected).toEqual([{title: 'Lead'}])
		expect(term?.enabled).toBe(false)
	})

	test('offers no filters before any postings load', () => {
		expect(buildJobFilters([], NOTHING_CHOSEN)).toEqual([])
	})
})

describe('visibleSections', () => {
	test('files every posting by how recently it went up', () => {
		let sections = visibleSections(CATEGORIES, buildJobFilters(ALL_JOBS, NOTHING_CHOSEN), '', TODAY)
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

		let sections = visibleSections(categories, buildJobFilters(jobs, NOTHING_CHOSEN), '', TODAY)
		expect(sections.map((section) => [section.title, ids([section])])).toEqual([
			['This Week', ['newest', 'newer']],
			['Last Week', ['last']],
			['Earlier', ['old']],
		])
	})

	test('keeps postings at any chosen level', () => {
		let filters = buildJobFilters(ALL_JOBS, {level: ['Entry-level', 'Lead'], term: null})
		expect(ids(visibleSections(CATEGORIES, filters, '', TODAY))).toEqual(['1', '3', '4', '6'])
	})

	test('keeps postings in a chosen term', () => {
		let filters = buildJobFilters(ALL_JOBS, {level: null, term: ['Fall']})
		expect(ids(visibleSections(CATEGORIES, filters, '', TODAY))).toEqual(['2'])
	})

	test('keeps postings with no stated term when "Not stated" is chosen', () => {
		let filters = buildJobFilters(ALL_JOBS, {level: null, term: ['Not stated']})
		expect(ids(visibleSections(CATEGORIES, filters, '', TODAY))).toEqual(['6'])
	})

	test('requires a posting to match both filters', () => {
		let filters = buildJobFilters(ALL_JOBS, {level: ['Entry-level'], term: ['Academic Year']})
		expect(ids(visibleSections(CATEGORIES, filters, '', TODAY))).toEqual(['1', '4'])
	})

	test('drops a section the filters empty', () => {
		let lastWeek = job('last', 'Summer Grader (WS-ST2)', '2026-08-26')
		let categories: JobCategory[] = [
			{id: 1, name: 'Student Work', count: 2, jobs: [MAIL, lastWeek]},
		]
		let filters = buildJobFilters([MAIL, lastWeek], {level: null, term: ['Summer']})
		expect(visibleSections(categories, filters, '', TODAY).map((section) => section.title)).toEqual(
			['Last Week'],
		)
	})

	test('searches the start of each word in the title', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN)
		expect(ids(visibleSections(CATEGORIES, filters, 'stock', TODAY))).toEqual(['7'])
		expect(ids(visibleSections(CATEGORIES, filters, 'ock', TODAY))).toEqual([])
	})

	test('requires every word of the search, in any order', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN)
		expect(ids(visibleSections(CATEGORIES, filters, 'assistant chem', TODAY))).toEqual(['2'])
	})

	test('ignores case and apostrophes in the search', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN)
		expect(ids(visibleSections(CATEGORIES, filters, 'LIONS pause', TODAY))).toEqual(['4'])
	})

	// lodash's `deburr` leaves letters like ǧ and ŋ alone; a live CURI title
	// has both.
	test('ignores accents beyond Latin-1 in the search', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN)
		expect(ids(visibleSections(CATEGORIES, filters, 'minagi kin', TODAY))).toEqual(['8'])
	})

	test('does not match the term prefix or pay code a student never sees', () => {
		let filters = buildJobFilters(ALL_JOBS, NOTHING_CHOSEN)
		expect(ids(visibleSections(CATEGORIES, filters, 'ws', TODAY))).toEqual([])
		expect(ids(visibleSections(CATEGORIES, filters, 'f26', TODAY))).toEqual([])
	})

	test('searches within the filtered postings', () => {
		let filters = buildJobFilters(ALL_JOBS, {level: ['Entry-level'], term: null})
		expect(ids(visibleSections(CATEGORIES, filters, 'student', TODAY))).toEqual(['1', '4', '6'])
	})
})
