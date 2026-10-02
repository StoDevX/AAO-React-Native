import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {openTestDatabase} from '../testing/harness.ts'
import {checkCatalog} from './check.ts'
import {writeFixtureCatalog, type FixtureCourse} from './fixture.ts'
import {makeCourse} from './testing-courses.ts'

function incoming(...courses: FixtureCourse[]) {
	let runner = openTestDatabase()
	runner.exec("attach database ':memory:' as incoming")
	writeFixtureCatalog(runner, courses, 'incoming')
	return runner
}

describe('checkCatalog', () => {
	it('accepts the catalog layout', () => {
		assert.doesNotThrow(() => checkCatalog(incoming(makeCourse()), 'incoming'))
	})

	it('rejects a catalog with no sections', () => {
		assert.throws(() => checkCatalog(incoming(), 'incoming'), /no sections/u)
	})

	it('names a missing column', () => {
		let runner = incoming(makeCourse())
		runner.exec('alter table incoming.section_instructor drop column position')
		assert.throws(() => checkCatalog(runner, 'incoming'), /section_instructor\.position/u)
	})

	it('names a missing view', () => {
		let runner = incoming(makeCourse())
		runner.exec('drop view incoming.offering_full')
		assert.throws(() => checkCatalog(runner, 'incoming'), /offering_full/u)
	})

	it('accepts the real published file', {skip: !process.env.CATALOG_FILE}, () => {
		let runner = openTestDatabase()
		runner.run({sql: 'attach database ? as incoming', params: [process.env.CATALOG_FILE ?? '']})
		assert.doesNotThrow(() => checkCatalog(runner, 'incoming'))
	})
})
