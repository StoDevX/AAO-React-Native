import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {openTestDatabase} from '../testing/harness.ts'
import {writeFixtureCatalog, type FixtureCourse} from './fixture.ts'
import {makeCourse} from './testing-courses.ts'

function catalogWith(...courses: FixtureCourse[]) {
	let runner = openTestDatabase()
	runner.exec("attach database ':memory:' as catalog")
	writeFixtureCatalog(runner, courses)
	return runner
}

describe('writeFixtureCatalog', () => {
	it('writes a section the way the catalog stores it', () => {
		let runner = catalogWith(makeCourse({clbid: '0000000007', section: 'A', title: 'Algebra I'}))
		let [row] = runner.all({
			sql: 'select clbid, number, typeof(number) as kind, section, name, title, enrollment_max from catalog.section_full',
			params: [],
		})
		assert.deepEqual(row, {
			clbid: 7,
			number: '252',
			kind: 'text',
			section: 'A',
			name: 'Abstract Algebra',
			title: 'Algebra I',
			enrollment_max: 20,
		})
	})

	it('joins paragraphs with newlines and keeps instructor order', () => {
		let runner = catalogWith(makeCourse({description: ['One.', 'Two.'], instructors: ['B', 'A']}))
		let [desc] = runner.all<{description: string}>({
			sql: 'select description from catalog.section_full',
			params: [],
		})
		assert.equal(desc?.description, 'One.\nTwo.')
		let names = runner
			.all<{name: string}>({
				sql: 'select i.name from catalog.section_instructor si join catalog.instructor i on i.id = si.instructor_id order by si.position',
				params: [],
			})
			.map((row) => row.name)
		assert.deepEqual(names, ['B', 'A'])
	})

	it('shares interned text and lookups between sections', () => {
		let runner = catalogWith(makeCourse({clbid: 1}), makeCourse({clbid: 2}))
		let [counts] = runner.all({
			sql: `select (select count(*) from catalog.name_text) as names,
				(select count(*) from catalog.instructor) as instructors,
				(select count(*) from catalog.gereq) as gereqs,
				(select count(*) from catalog.location) as locations`,
			params: [],
		})
		assert.deepEqual(counts, {names: 1, instructors: 1, gereqs: 1, locations: 1})
	})

	it('accepts the fields the JSON leaves out', () => {
		let course = makeCourse()
		delete course.offerings
		delete course.credits
		delete course.max
		delete course.prerequisites
		let runner = catalogWith(course)
		let [row] = runner.all({
			sql: 'select credits, enrollment_max, prerequisites from catalog.section_full',
			params: [],
		})
		assert.deepEqual(row, {credits: null, enrollment_max: null, prerequisites: null})
	})
})
