import {defineSearchIndex} from '../search/index.ts'

/**
 * Course search's index, rowid = `clbid`, kept in the catalog file beside the
 * tables it indexes. A course code or name outranks a title, a GE or an
 * instructor. Contentless, because its text is folded in JavaScript.
 */
export const COURSE_SEARCH = defineSearchIndex({
	name: 'course_fts',
	columns: [
		{name: 'dept_num', weight: 10},
		{name: 'name', weight: 8},
		{name: 'title', weight: 6},
		{name: 'gereqs', weight: 4},
		{name: 'instructors', weight: 3},
	],
})

/** The ETag of the catalog file on disk, so a refresh downloads only a changed file. */
export const COURSE_CREATE_SQL = `
create table course_catalog (
  id   integer primary key check (id = 1),
  etag text    not null
);`

export const COURSE_DROP_SQL = `
drop table if exists course_catalog;`
