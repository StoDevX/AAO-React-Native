import type {RawCourseType} from '../../lib/course-search/types.ts'
import type {SqlRunner} from '../sql.ts'
import {CATALOG_SCHEMA} from './schema.ts'

/** A course as the term JSON really sends it: ids may be zero-padded strings, and some fields can be missing. */
export type FixtureCourse = Omit<
	RawCourseType,
	'clbid' | 'crsid' | 'credits' | 'max' | 'offerings' | 'prerequisites'
> & {
	clbid: number | string
	crsid: number | string
	credits?: number
	max?: number
	offerings?: RawCourseType['offerings']
	prerequisites?: string | false
}

/**
 * The tables of `course-data-tools`' `catalog-recent.db` that course search
 * reads, created in `schema`. A view in an attached database resolves its
 * unqualified names within that database, so only created names carry the
 * prefix.
 */
function catalogSql(schema: string): string {
	let interned = ['name_text', 'title_text', 'description_text', 'notes_text', 'prerequisites_text']
	return `
${interned.map((table) => `create table ${schema}.${table} (id integer primary key, text text);`).join('\n')}
create table ${schema}.gereq (id integer primary key, code text);
create table ${schema}.instructor (id integer primary key, fsnum text, name text);
create table ${schema}.location (id integer primary key, name text);
create table ${schema}.timeslot (id integer primary key, day text, start text, "end" text);
create table ${schema}.section (
  clbid integer primary key, crsid integer, term integer, year integer, semester integer,
  department text, number text, section text, level integer, type text,
  name_id integer, title_id integer, description_id integer, credits real, pass_nopass integer,
  learning_mode text, status text, enrolled integer, enrollment_max integer,
  notes_id integer, prerequisites_id integer
);
create table ${schema}.section_gereq (clbid integer, gereq_id integer, primary key (clbid, gereq_id));
create table ${schema}.section_instructor (clbid integer, instructor_id integer, position integer, primary key (clbid, instructor_id));
create table ${schema}.offering (id integer primary key, clbid integer, timeslot_id integer, location_id integer);
create view ${schema}.section_full as
  select s.clbid, s.crsid, s.term, s.year, s.semester, s.department, s.number, s.section, s.level, s.type,
    n.text as name, t.text as title, d.text as description, s.credits, s.pass_nopass, s.learning_mode,
    s.status, s.enrolled, s.enrollment_max, nt.text as notes, p.text as prerequisites
  from section s
  left join name_text n on s.name_id = n.id
  left join title_text t on s.title_id = t.id
  left join description_text d on s.description_id = d.id
  left join notes_text nt on s.notes_id = nt.id
  left join prerequisites_text p on s.prerequisites_id = p.id;
create view ${schema}.offering_full as
  select o.id, o.clbid, ts.day, ts.start, ts."end", loc.name as location
  from offering o
  left join timeslot ts on o.timeslot_id = ts.id
  left join location loc on o.location_id = loc.id;`
}

/**
 * Writes `courses` into a catalog layout in `schema`, which must already be
 * attached. Used by tests, and under UI testing in place of the download.
 */
export function writeFixtureCatalog(
	runner: SqlRunner,
	courses: FixtureCourse[],
	schema: string = CATALOG_SCHEMA,
): void {
	runner.exec(catalogSql(schema))

	// The id of the row in `table` whose columns hold `values`, adding it if needed.
	let lookup = (table: string, values: Record<string, string>): number => {
		let columns = Object.keys(values)
		let params = Object.values(values)
		let where = columns.map((column) => `"${column}" = ?`).join(' and ')
		let [found] = runner.all<{id: number}>({
			sql: `select id from ${schema}.${table} where ${where}`,
			params,
		})
		if (found) return found.id
		let [added] = runner.all<{id: number}>({
			sql: `insert into ${schema}.${table} (${columns.map((column) => `"${column}"`).join(', ')})
				values (${columns.map(() => '?').join(', ')}) returning id`,
			params,
		})
		if (!added) throw new Error(`No id for ${table}`)
		return added.id
	}
	let intern = (table: string, text: string | undefined | false): number | null =>
		text ? lookup(table, {text}) : null

	runner.transaction(() => {
		for (let course of courses) {
			let clbid = Number(course.clbid)
			runner.run({
				sql: `insert into ${schema}.section (clbid, crsid, term, year, semester, department, number, section,
					level, type, name_id, title_id, description_id, credits, pass_nopass, learning_mode, status,
					enrolled, enrollment_max, notes_id, prerequisites_id)
					values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?)`,
				params: [
					clbid,
					Number(course.crsid),
					course.term,
					course.year,
					course.semester,
					course.department,
					String(course.number),
					course.section ?? null,
					course.level,
					course.type,
					intern('name_text', course.name),
					intern('title_text', course.title),
					intern('description_text', course.description?.join('\n')),
					course.credits ?? null,
					course.pn ? 1 : 0,
					course.status,
					course.enrolled,
					course.max ?? null,
					intern('notes_text', course.notes?.join('\n')),
					intern('prerequisites_text', course.prerequisites),
				],
			})
			for (let code of new Set(course.gereqs)) {
				runner.run({
					sql: `insert into ${schema}.section_gereq (clbid, gereq_id) values (?, ?)`,
					params: [clbid, lookup('gereq', {code})],
				})
			}
			for (let [position, name] of (course.instructors ?? []).entries()) {
				runner.run({
					sql: `insert into ${schema}.section_instructor (clbid, instructor_id, position) values (?, ?, ?)`,
					params: [clbid, lookup('instructor', {name}), position],
				})
			}
			for (let offering of course.offerings ?? []) {
				let {day, start, end, location} = offering
				runner.run({
					sql: `insert into ${schema}.offering (clbid, timeslot_id, location_id) values (?, ?, ?)`,
					params: [
						clbid,
						lookup('timeslot', {day, start, end}),
						lookup('location', {name: location}),
					],
				})
			}
		}
	})
}
