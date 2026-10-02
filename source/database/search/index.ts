import {deburr, words} from '../../lib/text.ts'
import {placeholders, type BindValue, type Statement} from '../sql.ts'

/** One indexed column, and how much a match in it counts toward rank. */
export type SearchColumn = {name: string; weight: number}

/** The SQL that builds, fills and queries one search index. */
export type SearchIndex = {
	name: string
	/** `bm25` with each column's weight, for `order by`; lower is a better match. */
	rankExpression: string
	/** Creates the index in the database attached as `schema`. */
	createSql(schema: string): string
	/** Adds one row to the index in `schema`, `values` in column order. */
	insert(schema: string, rowid: number, values: string[]): Statement
	/** The `where` clause matching every term, or null when there are none. */
	matchClause(terms: string[]): {sql: string; params: BindValue[]} | null
}

/**
 * A contentless FTS5 index: it keeps only tokens, so each row's text is
 * whatever the caller inserted -- already folded, or gathered from several
 * tables -- and results are joined back to their source by rowid.
 */
export function defineSearchIndex(spec: {name: string; columns: SearchColumn[]}): SearchIndex {
	let {name, columns} = spec
	let list = columns.map((column) => column.name).join(', ')

	return {
		name,
		rankExpression: `bm25(${name}, ${columns.map((column) => column.weight).join(', ')})`,
		createSql: (schema) =>
			`create virtual table ${schema}.${name} using fts5(${list}, content = '', tokenize = 'unicode61 remove_diacritics 2');`,
		insert: (schema, rowid, values) => {
			if (values.length !== columns.length) {
				throw new Error(`${name} takes ${columns.length} values, got ${values.length}`)
			}
			return {
				sql: `insert into ${schema}.${name} (rowid, ${list}) values (?, ${placeholders(values.length)})`,
				params: [rowid, ...values],
			}
		},
		matchClause: (terms) =>
			terms.length === 0 ? null : {sql: `${name} match ?`, params: [terms.join(' AND ')]},
	}
}

/**
 * What someone typed, as FTS5 terms: each word, folded as the indexed text
 * is, quoted so FTS5 reads it as text and never as an operator, and starred
 * so it matches as a prefix. Text with no words gives no terms.
 */
export function searchTerms(query: string): string[] {
	return words(deburr(query.toLowerCase())).map((word) => `"${word.replaceAll('"', '""')}"*`)
}
