import type {SqlRunner} from '../sql.ts'

/** Every table, view and column course search reads from the catalog. */
export const REQUIRED_COLUMNS: Record<string, string[]> = {
	section: [
		'clbid',
		'term',
		'year',
		'department',
		'number',
		'section',
		'level',
		'type',
		'status',
		'enrolled',
		'enrollment_max',
		'name_id',
		'title_id',
		'notes_id',
	],
	section_full: [
		'clbid',
		'crsid',
		'term',
		'year',
		'semester',
		'department',
		'number',
		'section',
		'level',
		'type',
		'name',
		'title',
		'description',
		'credits',
		'pass_nopass',
		'status',
		'enrolled',
		'enrollment_max',
		'notes',
		'prerequisites',
	],
	offering_full: ['id', 'clbid', 'day', 'start', 'end', 'location'],
	name_text: ['id', 'text'],
	title_text: ['id', 'text'],
	notes_text: ['id', 'text'],
	gereq: ['id', 'code'],
	section_gereq: ['clbid', 'gereq_id'],
	instructor: ['id', 'name'],
	section_instructor: ['clbid', 'instructor_id', 'position'],
}

/**
 * Throws unless the database attached as `schema` has every table and column
 * course search reads, and at least one section. Run on a download before it
 * replaces the catalog, so a file published without a column, or with no
 * sections, is never swapped in. A file that is not a whole SQLite database
 * fails earlier, when it is attached.
 */
export function checkCatalog(runner: SqlRunner, schema: string): void {
	for (let [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
		let present = new Set(
			runner
				.all<{name: string}>({
					sql: 'select name from pragma_table_info(?, ?)',
					params: [table, schema],
				})
				.map((row) => row.name),
		)
		if (present.size === 0) throw new Error(`The course catalog has no ${table}`)
		for (let column of columns) {
			if (!present.has(column)) throw new Error(`The course catalog has no ${table}.${column}`)
		}
	}
	let [count] = runner.all<{n: number}>({
		sql: `select count(*) as n from ${schema}.section`,
		params: [],
	})
	if (!count || count.n === 0) throw new Error('The course catalog has no sections')
}
