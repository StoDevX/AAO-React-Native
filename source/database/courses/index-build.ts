import {deburr} from '../../lib/text.ts'
import type {SqlRunner} from '../sql.ts'
import {CATALOG_SCHEMA, COURSE_SEARCH} from './schema.ts'

/** What the index is built from, in `schema`: one row per section, its lists joined by spaces. */
function indexSource(schema: string): string {
	return `
select s.clbid,
  -- The section apart from the number: the tokenizer would read "386A" as
  -- one word, while a search for it looks for "386" and "a".
  s.department || ' ' || s.number || coalesce(' ' || s.section, '') as dept_num,
  coalesce(n.text, '') as name,
  coalesce(t.text, '') as title,
  coalesce((select group_concat(g.code, ' ') from ${schema}.section_gereq sg
    join ${schema}.gereq g on g.id = sg.gereq_id where sg.clbid = s.clbid), '') as gereqs,
  coalesce((select group_concat(i.name, ' ') from ${schema}.section_instructor si
    join ${schema}.instructor i on i.id = si.instructor_id where si.clbid = s.clbid), '') as instructors
from ${schema}.section s
left join ${schema}.name_text n on n.id = s.name_id
left join ${schema}.title_text t on t.id = s.title_id
where s.clbid > ?
order by s.clbid
limit ?`
}

type IndexSourceRow = {
	clbid: number
	dept_num: string
	name: string
	title: string
	gereqs: string
	instructors: string
}

/** How many sections an index batch reads and writes before the app gets a turn. */
const INDEX_BATCH_SIZE = 1000

/**
 * Creates `course_fts` in the catalog attached as `schema` and fills it, a
 * batch of sections at a time, yielding the number indexed so far after each;
 * then indexes the unsearched listing's order. Building takes most of a
 * second, so the refresh lets the app run between batches. Each batch is its
 * own transaction, which is safe because nothing reads the catalog being
 * built until it is swapped in whole.
 */
export function* courseIndexBatches(
	runner: SqlRunner,
	schema: string,
	batchSize: number = INDEX_BATCH_SIZE,
): Generator<number, void> {
	runner.exec(COURSE_SEARCH.createSql(schema))
	let indexed = 0
	let after = 0
	while (true) {
		let rows = runner.all<IndexSourceRow>({sql: indexSource(schema), params: [after, batchSize]})
		if (rows.length === 0) break
		runner.transaction(() => {
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
		indexed += rows.length
		after = rows.at(-1)?.clbid ?? after
		yield indexed
	}
	// The unsearched listing's order, so paging through it reads the index
	// rather than sorting every course for each page.
	runner.exec(
		`create index ${schema}.section_listing on section (term desc, department, cast(number as integer), section, clbid)`,
	)
}

/** Builds the whole index at once, for a catalog nobody is waiting on. Returns the rows indexed. */
export function buildCourseIndex(runner: SqlRunner, schema: string): number {
	let indexed = 0
	for (indexed of courseIndexBatches(runner, schema)) {
		// Each batch has already been written.
	}
	return indexed
}

/**
 * The ETag the attached catalog was downloaded with, or null when there is no
 * catalog or it records none. It lives in the catalog file itself, so the two
 * can never disagree, and a reset of the app's own database does not lose it.
 */
export function storedEtag(runner: SqlRunner): string | null {
	let [table] = runner.all<{n: number}>({
		sql: `select count(*) as n from pragma_table_list where schema = ? and name = 'aao_download'`,
		params: [CATALOG_SCHEMA],
	})
	if (!table?.n) return null
	let [row] = runner.all<{etag: string}>({
		sql: `select etag from ${CATALOG_SCHEMA}.aao_download where id = 1`,
		params: [],
	})
	return row?.etag ?? null
}

/** Records in the catalog attached as `schema` the ETag it was downloaded with. */
export function storeEtag(runner: SqlRunner, schema: string, etag: string): void {
	runner.exec(
		`create table if not exists ${schema}.aao_download (id integer primary key check (id = 1), etag text not null);`,
	)
	runner.run({
		sql: `insert into ${schema}.aao_download (id, etag) values (1, ?) on conflict (id) do update set etag = excluded.etag`,
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
