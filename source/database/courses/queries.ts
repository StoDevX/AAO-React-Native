import {searchTerms} from '../search/index.ts'
import {placeholders, type BindValue, type Statement} from '../sql.ts'
import {CATALOG_SCHEMA as C} from './fixture.ts'
import type {CourseFilters} from './filters.ts'
import {COURSE_SEARCH} from './schema.ts'

/** Separates the values `group_concat` joins: the unit separator, which no catalog text holds. */
export const LIST_SEPARATOR = '\u001F'

const LIST_COLUMNS = `
  s.clbid, s.term, s.department, cast(s.number as integer) as number, s.section, s.status,
  n.text as name, t.text as title, nt.text as notes,
  (select group_concat(code, char(31)) from (select g.code from ${C}.section_gereq sg
    join ${C}.gereq g on g.id = sg.gereq_id where sg.clbid = s.clbid order by g.code)) as gereqs,
  (select group_concat(name, char(31)) from (select i.name from ${C}.section_instructor si
    join ${C}.instructor i on i.id = si.instructor_id where si.clbid = s.clbid order by si.position)) as instructors`

const LIST_JOINS = `
left join ${C}.name_text n on n.id = s.name_id
left join ${C}.title_text t on t.id = s.title_id
left join ${C}.notes_text nt on nt.id = s.notes_id`

/** A slice of results: `limit` rows, after skipping `offset`. */
export type ResultsPage = {offset: number; limit: number}

/**
 * Course search's rows: newest term first, then best match first, or by
 * department, number and section when nothing is typed. Ties fall back to
 * `clbid`, so the order is the same on every read and pages never overlap.
 */
export function courseResultsQuery(args: {
	query: string
	filters: CourseFilters
	page?: ResultsPage
}): Statement {
	let {filters} = args
	// `term in ()` is a syntax error; no terms finds nothing.
	if (filters.terms.length === 0) {
		return {sql: `select ${LIST_COLUMNS} from ${C}.section s ${LIST_JOINS} where 0`, params: []}
	}

	let match = COURSE_SEARCH.matchClause(searchTerms(args.query))
	let where: string[] = [`s.term in (${placeholders(filters.terms.length)})`]
	let params: BindValue[] = [...filters.terms]

	if (match) {
		where.push(match.sql)
		params.push(...match.params)
	}
	// A section with no published maximum has no seat known to be free.
	if (filters.spaceAvailable) where.push('s.enrolled < s.enrollment_max')
	if (filters.openOnly) where.push("s.status = 'O'")
	if (filters.labOnly) where.push("s.type = 'Lab'")
	if (filters.departments.length > 0) {
		where.push(`s.department in (${placeholders(filters.departments.length)})`)
		params.push(...filters.departments)
	}
	if (filters.levels.length > 0) {
		where.push(`s.level in (${placeholders(filters.levels.length)})`)
		params.push(...filters.levels)
	}
	if (filters.gereqs.length > 0) {
		let matching = `from ${C}.section_gereq sg join ${C}.gereq g on g.id = sg.gereq_id
			where sg.clbid = s.clbid and g.code in (${placeholders(filters.gereqs.length)})`
		if (filters.gereqMode === 'AND') {
			where.push(`(select count(*) ${matching}) = ?`)
			params.push(...filters.gereqs, new Set(filters.gereqs).size)
		} else {
			where.push(`exists (select 1 ${matching})`)
			params.push(...filters.gereqs)
		}
	}

	let from = match
		? `${C}.${COURSE_SEARCH.name} join ${C}.section s on s.clbid = ${COURSE_SEARCH.name}.rowid`
		: `${C}.section s`
	// After the newest term first; the unsearched order is the one
	// `section_listing` indexes, so that listing reads in index order.
	let keys = match
		? ['s.term', COURSE_SEARCH.rankExpression, 's.clbid']
		: ['s.term', 's.department', 'cast(s.number as integer)', 's.section', 's.clbid']
	let order = (column: (key: string, at: number) => string) =>
		keys.map((key, at) => `${column(key, at)}${at === 0 ? ' desc' : ''}`).join(', ')

	// Sorted and paged on the keys alone, then the list columns are read for
	// just the page's rows: working them out for every match before the sort
	// cost far more than the sort.
	let paged = args.page ? ' limit ? offset ?' : ''
	if (args.page) params.push(args.page.limit, args.page.offset)
	let sql = `select ${LIST_COLUMNS}
from (
  select ${keys.map((key, at) => `${key} as k${at}`).join(', ')}
  from ${from}
  where ${where.join(' and ')}
  order by ${order((key) => key)}${paged}
) page
join ${C}.section s on s.clbid = page.k${keys.length - 1}
${LIST_JOINS}
order by ${order((_, at) => `page.k${at}`)}`
	return {sql, params}
}

/** One course's row, for the detail screen. */
export function courseQuery(clbid: number): Statement {
	return {sql: `select * from ${C}.section_full where clbid = ?`, params: [clbid]}
}

/** The lists the detail screen draws, for one course, each in its order. */
export function courseChildrenQueries(
	clbid: number,
): Record<'gereqs' | 'instructors' | 'offerings', Statement> {
	return {
		gereqs: {
			sql: `select g.code from ${C}.section_gereq sg join ${C}.gereq g on g.id = sg.gereq_id
				where sg.clbid = ? order by g.code`,
			params: [clbid],
		},
		instructors: {
			sql: `select i.name from ${C}.section_instructor si join ${C}.instructor i on i.id = si.instructor_id
				where si.clbid = ? order by si.position`,
			params: [clbid],
		},
		offerings: {
			sql: `select day, start, "end", location from ${C}.offering_full where clbid = ? order by id`,
			params: [clbid],
		},
	}
}

/** The toolbar's options: terms from `minimumYear` on, newest first, and the GEs and departments taught in them. */
export function filterOptionsQueries(
	minimumYear: number,
): Record<'terms' | 'gereqs' | 'departments', Statement> {
	return {
		terms: {
			sql: `select distinct term from ${C}.section where year >= ? order by term desc`,
			params: [minimumYear],
		},
		gereqs: {
			sql: `select distinct g.code from ${C}.section s join ${C}.section_gereq sg on sg.clbid = s.clbid
				join ${C}.gereq g on g.id = sg.gereq_id where s.year >= ? order by g.code`,
			params: [minimumYear],
		},
		departments: {
			sql: `select distinct department from ${C}.section where year >= ? order by department`,
			params: [minimumYear],
		},
	}
}
