import assert from 'node:assert/strict'
import {rmSync} from 'node:fs'
import {describe, it} from 'node:test'

import {ensureSchema, RESET_SQL} from '../schema.ts'
import {openTestDatabase} from '../testing/harness.ts'
import {writeFixtureCatalog, type FixtureCourse} from './fixture.ts'
import {buildCourseIndex, openCatalog, storedEtag, storeEtag} from './index-build.ts'
import {makeCourse} from './testing-courses.ts'

function withCatalog(...courses: FixtureCourse[]) {
	let runner = openTestDatabase()
	ensureSchema(runner, 'test')
	runner.exec("attach database ':memory:' as catalog")
	writeFixtureCatalog(runner, courses)
	return runner
}

function matches(runner: ReturnType<typeof openTestDatabase>, match: string): number[] {
	return runner
		.all<{rowid: number}>({
			sql: 'select rowid from catalog.course_fts where course_fts match ? order by rowid',
			params: [match],
		})
		.map((row) => row.rowid)
}

/** A catalog file on disk, with or without its index, for `openCatalog`. */
function catalogFileAt(path: string, indexed: boolean): void {
	let writer = openTestDatabase()
	writer.run({sql: 'attach database ? as catalog', params: [path]})
	writeFixtureCatalog(writer, [makeCourse({clbid: 3})])
	if (indexed) buildCourseIndex(writer, 'catalog')
	writer.exec('detach database catalog')
}

describe('buildCourseIndex', () => {
	it('indexes every section under its clbid', () => {
		let runner = withCatalog(makeCourse({clbid: 7}), makeCourse({clbid: 9, name: 'Topology'}))
		assert.equal(buildCourseIndex(runner, 'catalog'), 2)
		assert.deepEqual(matches(runner, '"topology"*'), [9])
		assert.deepEqual(matches(runner, '"math"* AND "252"*'), [7, 9])
	})

	it('folds accents in names, titles and instructors', () => {
		let runner = withCatalog(makeCourse({instructors: ['Mináǧi Kiŋ'], title: 'Café Society'}))
		buildCourseIndex(runner, 'catalog')
		assert.deepEqual(matches(runner, '"minagi"* AND "kin"* AND "cafe"*'), [1])
	})

	it('indexes GE codes', () => {
		let runner = withCatalog(makeCourse({gereqs: ['WRI', 'SED']}))
		buildCourseIndex(runner, 'catalog')
		assert.deepEqual(matches(runner, '"sed"*'), [1])
	})

	it('writes the index into the schema it is given, not the app database', () => {
		let runner = withCatalog(makeCourse())
		buildCourseIndex(runner, 'catalog')
		let inMain = runner.all({
			sql: "select name from main.sqlite_master where name = 'course_fts'",
			params: [],
		})
		assert.deepEqual(inMain, [])
	})
})

describe('openCatalog', () => {
	it('attaches an indexed file', () => {
		let path = `/tmp/aao-catalog-indexed-${process.pid}.db`
		try {
			catalogFileAt(path, true)
			let runner = openTestDatabase()
			ensureSchema(runner, 'test')
			openCatalog(runner, path)
			assert.deepEqual(matches(runner, '"algebra"*'), [3])
		} finally {
			rmSync(path, {force: true})
		}
	})

	it('refuses a file with no index, and leaves it detached', () => {
		let path = `/tmp/aao-catalog-bare-${process.pid}.db`
		try {
			catalogFileAt(path, false)
			let runner = openTestDatabase()
			ensureSchema(runner, 'test')
			assert.throws(() => openCatalog(runner, path), /no course_fts/u)
			let attached = runner.all<{name: string}>({
				sql: 'select name from pragma_database_list',
				params: [],
			})
			assert.ok(!attached.some((row) => row.name === 'catalog'))
		} finally {
			rmSync(path, {force: true})
		}
	})

	it('does nothing without a file', () => {
		let runner = openTestDatabase()
		ensureSchema(runner, 'test')
		assert.doesNotThrow(() => openCatalog(runner, null))
	})
})

describe('the stored ETag', () => {
	it('is null until stored, then the last one stored', () => {
		let runner = openTestDatabase()
		ensureSchema(runner, 'test')
		assert.equal(storedEtag(runner), null)
		storeEtag(runner, 'e1')
		storeEtag(runner, 'e2')
		assert.equal(storedEtag(runner), 'e2')
	})

	it('goes with a reset', () => {
		let runner = openTestDatabase()
		ensureSchema(runner, 'test')
		storeEtag(runner, 'e1')
		runner.exec(RESET_SQL)
		let left = runner.all({
			sql: "select name from sqlite_master where name like 'course%'",
			params: [],
		})
		assert.deepEqual(left, [])
	})
})
