import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import type {SqlRunner} from '../sql.ts'
import {openTestDatabase} from '../testing/harness.ts'
import {defineSearchIndex, searchTerms} from './index.ts'

const THING_SEARCH = defineSearchIndex({
	name: 'thing_fts',
	columns: [
		{name: 'title', weight: 10},
		{name: 'body', weight: 1},
	],
})

function openThings(): SqlRunner {
	let runner = openTestDatabase()
	runner.exec("attach database ':memory:' as other")
	runner.exec(THING_SEARCH.createSql('other'))
	return runner
}

function add(runner: SqlRunner, rowid: number, title: string, body: string): void {
	runner.run(THING_SEARCH.insert('other', rowid, [title, body]))
}

function search(runner: SqlRunner, query: string): number[] {
	let match = THING_SEARCH.matchClause(searchTerms(query))
	if (!match) return []
	return runner
		.all<{rowid: number}>({
			sql: `select rowid from other.thing_fts where ${match.sql} order by ${THING_SEARCH.rankExpression}`,
			params: match.params,
		})
		.map((row) => row.rowid)
}

describe('defineSearchIndex', () => {
	it('finds a row by a prefix of any word in any column', () => {
		let runner = openThings()
		add(runner, 1, 'Abstract Algebra', 'groups and rings')
		add(runner, 2, 'Software Design', 'patterns')

		assert.deepEqual(search(runner, 'alg'), [1])
		assert.deepEqual(search(runner, 'ring'), [1])
		assert.deepEqual(search(runner, 'pat'), [2])
	})

	it('needs every word to match', () => {
		let runner = openThings()
		add(runner, 1, 'Abstract Algebra', 'groups')
		add(runner, 2, 'Abstract Art', 'paint')

		assert.deepEqual(search(runner, 'abstract alg'), [1])
	})

	it('ranks a match in a heavier column first', () => {
		let runner = openThings()
		add(runner, 1, 'Pottery', 'algebra of glazes')
		add(runner, 2, 'Algebra', 'groups')

		assert.deepEqual(search(runner, 'algebra'), [2, 1])
	})

	it('matches a contraction typed whole', () => {
		let runner = openThings()
		add(runner, 1, "Student's Guide", '')
		assert.deepEqual(search(runner, "student's"), [1])
	})

	it('creates the index in the schema it is given', () => {
		let runner = openThings()
		let [found] = runner.all<{n: number}>({
			sql: "select count(*) as n from other.sqlite_master where name = 'thing_fts'",
			params: [],
		})
		assert.equal(found?.n, 1)
	})

	it('rejects a row with the wrong number of values', () => {
		assert.throws(() => THING_SEARCH.insert('other', 1, ['only one']))
	})

	it('has no match clause for no terms', () => {
		assert.equal(THING_SEARCH.matchClause([]), null)
	})
})

describe('searchTerms', () => {
	it('makes each word a quoted prefix term, without accents', () => {
		assert.deepEqual(searchTerms('Mináǧi Kiŋ'), ['"minagi"*', '"kin"*'])
	})

	it('reads FTS5 operators and stray quotes as plain text', () => {
		assert.deepEqual(searchTerms('NEAR "math" AND -art*'), [
			'"near"*',
			'"math"*',
			'"and"*',
			'"art"*',
		])
	})

	it('keeps a contraction as one term', () => {
		assert.deepEqual(searchTerms("student's"), ['"student\'s"*'])
	})

	it('has no terms for text with no words', () => {
		assert.deepEqual(searchTerms('  -- 🙂 '), [])
	})
})
