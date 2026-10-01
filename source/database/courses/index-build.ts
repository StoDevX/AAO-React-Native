import {deburr} from '../../lib/text.ts'
import type {SqlRunner} from '../sql.ts'
import {CATALOG_SCHEMA} from './fixture.ts'
import {COURSE_SEARCH} from './schema.ts'

/** What the index is built from, in `schema`: one row per section, its lists joined by spaces. */
function indexSource(schema: string): string {
	return `
select s.clbid,
  s.department || ' ' || s.number || coalesce(s.section, '') as dept_num,
  coalesce(n.text, '') as name,
  coalesce(t.text, '') as title,
  coalesce((select group_concat(g.code, ' ') from ${schema}.section_gereq sg
    join ${schema}.gereq g on g.id = sg.gereq_id where sg.clbid = s.clbid), '') as gereqs,
  coalesce((select group_concat(i.name, ' ') from ${schema}.section_instructor si
    join ${schema}.instructor i on i.id = si.instructor_id where si.clbid = s.clbid), '') as instructors
from ${schema}.section s
left join ${schema}.name_text n on n.id = s.name_id
left join ${schema}.title_text t on t.id = s.title_id`
}

type IndexSourceRow = {
	clbid: number
	dept_num: string
	name: string
	title: string
	gereqs: string
	instructors: string
}

/**
 * Creates `course_fts` in the catalog attached as `schema` and fills it, in
 * one transaction. Returns the rows indexed.
 */
export function buildCourseIndex(runner: SqlRunner, schema: string): number {
	let rows = runner.all<IndexSourceRow>({sql: indexSource(schema), params: []})
	runner.transaction(() => {
		runner.exec(COURSE_SEARCH.createSql(schema))
		for (let row of rows) {
			runner.run(
				COURSE_SEARCH.insert(schema, row.clbid, [
					row.dept_num,
					deburr(row.name),
					deburr(row.title),
					row.gereqs,
					deburr(row.instructors),
				]),
			)
		}
	})
	return rows.length
}

/** The ETag the catalog file on disk was downloaded with, or null when none is recorded. */
export function storedEtag(runner: SqlRunner): string | null {
	let [row] = runner.all<{etag: string}>({
		sql: 'select etag from course_catalog where id = 1',
		params: [],
	})
	return row?.etag ?? null
}

export function storeEtag(runner: SqlRunner, etag: string): void {
	runner.run({
		sql: 'insert into course_catalog (id, etag) values (1, ?) on conflict (id) do update set etag = excluded.etag',
		params: [etag],
	})
}

/**
 * Attaches the catalog file at `path` as `catalog`. A file without its index
 * cannot be searched, so it is detached again and the throw tells the caller
 * to discard it. With no file there is nothing to attach, and course search
 * waits for its first download.
 */
export function openCatalog(runner: SqlRunner, path: string | null): void {
	if (path === null) return
	runner.run({sql: `attach database ? as ${CATALOG_SCHEMA}`, params: [path]})
	let [found] = runner.all<{n: number}>({
		sql: `select count(*) as n from ${CATALOG_SCHEMA}.sqlite_master where name = ?`,
		params: [COURSE_SEARCH.name],
	})
	if (!found?.n) {
		runner.exec(`detach database ${CATALOG_SCHEMA}`)
		throw new Error(`The course catalog has no ${COURSE_SEARCH.name}`)
	}
}
