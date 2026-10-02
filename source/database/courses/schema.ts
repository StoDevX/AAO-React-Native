import {defineSearchIndex} from '../search/index.ts'

/** The schema name the catalog file is attached under. */
export const CATALOG_SCHEMA = 'catalog'

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
