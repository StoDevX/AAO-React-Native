import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ensureSchema} from '../schema.ts'
import {openTestDatabase} from '../testing/harness.ts'
import {writeFixtureCatalog, type FixtureCourse} from './fixture.ts'
import type {CourseFilters} from './filters.ts'
import {buildCourseIndex} from './index-build.ts'
import {
	courseChildrenQueries,
	courseQuery,
	courseResultsQuery,
	filterOptionsQueries,
} from './queries.ts'
import {
	hydrateCourse,
	listItem,
	sectionsByTerm,
	type CourseChildren,
	type CourseListItem,
	type CourseListRow,
	type CourseRow,
} from './rows.ts'
import {makeCourse} from './testing-courses.ts'

const NONE: CourseFilters = {
	terms: [20261, 20262],
	spaceAvailable: false,
	openOnly: false,
	labOnly: false,
	departments: [],
	levels: [],
	gereqs: [],
	gereqMode: 'AND',
}

function catalog(...courses: FixtureCourse[]) {
	let runner = openTestDatabase()
	ensureSchema(runner, 'test')
	runner.exec("attach database ':memory:' as catalog")
	writeFixtureCatalog(runner, courses)
	buildCourseIndex(runner, 'catalog')
	return runner
}

function find(
	runner: ReturnType<typeof catalog>,
	query: string,
	filters: Partial<CourseFilters> = {},
): number[] {
	return runner
		.all<CourseListRow>(courseResultsQuery({query, filters: {...NONE, ...filters}}))
		.map((row) => row.clbid)
}

function readCourse(runner: ReturnType<typeof catalog>, clbid: number) {
	let [row] = runner.all<CourseRow>(courseQuery(clbid))
	assert.ok(row)
	let queries = courseChildrenQueries(clbid)
	let children: CourseChildren = {
		gereqs: runner.all(queries.gereqs),
		instructors: runner.all(queries.instructors),
		offerings: runner.all(queries.offerings),
	}
	return hydrateCourse(row, children)
}

const ascending = (ids: number[]) => ids.sort((a, b) => a - b)

describe('courseResultsQuery: search', () => {
	it('matches every word as a prefix, across fields', () => {
		let runner = catalog(
			makeCourse({clbid: 1, name: 'Abstract Algebra', instructors: ['Jill Dietz']}),
			makeCourse({clbid: 2, name: 'Calculus', instructors: ['Jill Dietz']}),
		)
		assert.deepEqual(find(runner, 'dietz alg'), [1])
		assert.deepEqual(ascending(find(runner, 'math 252')), [1, 2])
	})

	it('ranks a course-code match above an instructor match', () => {
		let runner = catalog(
			makeCourse({
				clbid: 1,
				department: 'ART',
				number: 101,
				name: 'Drawing',
				instructors: ['Csci Fan'],
				gereqs: [],
			}),
			makeCourse({
				clbid: 2,
				department: 'CSCI',
				number: 121,
				name: 'Principles',
				instructors: ['Ada'],
				gereqs: [],
			}),
		)
		assert.deepEqual(find(runner, 'csci'), [2, 1])
	})

	it('finds accented and apostrophe names typed plainly', () => {
		let runner = catalog(
			makeCourse({clbid: 1, instructors: ['Mináǧi Kiŋ']}),
			makeCourse({clbid: 2, instructors: ["Liam O'Neill"]}),
		)
		assert.deepEqual(find(runner, 'minagi kin'), [1])
		assert.deepEqual(find(runner, 'neill'), [2])
		assert.deepEqual(find(runner, 'o neill'), [2])
	})

	it('lists every course by department and number when the query has no words', () => {
		let runner = catalog(
			makeCourse({clbid: 1, department: 'MATH', number: 252}),
			makeCourse({clbid: 2, department: 'MATH', number: 31}),
			makeCourse({clbid: 3, department: 'ART', number: 101}),
		)
		assert.deepEqual(find(runner, ''), [3, 2, 1])
		assert.deepEqual(find(runner, ' -- 🙂 '), [3, 2, 1])
	})

	it('puts the newest term first', () => {
		let runner = catalog(makeCourse({clbid: 1, term: 20261}), makeCourse({clbid: 2, term: 20262}))
		assert.deepEqual(find(runner, 'algebra'), [2, 1])
	})
})

describe('courseResultsQuery: filters', () => {
	let runner = catalog(
		makeCourse({
			clbid: 1,
			term: 20261,
			department: 'MATH',
			level: 200,
			status: 'O',
			type: 'Research',
			enrolled: 5,
			max: 20,
			gereqs: ['WRI', 'SED'],
		}),
		makeCourse({
			clbid: 2,
			term: 20262,
			department: 'CHEM',
			level: 300,
			status: 'C',
			type: 'Lab',
			enrolled: 20,
			max: 20,
			gereqs: ['WRI'],
		}),
		makeCourse({
			clbid: 3,
			term: 20262,
			department: 'ART',
			level: 100,
			status: 'O',
			type: 'Lecture',
			enrolled: 1,
			max: 9,
			gereqs: [],
		}),
		makeCourse({
			clbid: 4,
			term: 20262,
			department: 'ART',
			level: 100,
			status: 'O',
			type: 'Lecture',
			enrolled: 0,
			max: undefined,
			gereqs: [],
		}),
	)

	it('limits to the chosen terms', () => assert.deepEqual(find(runner, '', {terms: [20261]}), [1]))
	it('finds nothing in no terms', () => assert.deepEqual(find(runner, '', {terms: []}), []))
	it('keeps only courses with a known seat free', () =>
		assert.deepEqual(ascending(find(runner, '', {spaceAvailable: true})), [1, 3]))
	it('keeps only open courses', () =>
		assert.deepEqual(ascending(find(runner, '', {openOnly: true})), [1, 3, 4]))
	it('keeps only labs', () => assert.deepEqual(find(runner, '', {labOnly: true}), [2]))
	it('keeps chosen departments', () =>
		assert.deepEqual(ascending(find(runner, '', {departments: ['CHEM', 'MATH']})), [1, 2]))
	it('keeps chosen levels', () =>
		assert.deepEqual(ascending(find(runner, '', {levels: [200, 300]})), [1, 2]))
	it('keeps courses with every chosen GE', () =>
		assert.deepEqual(find(runner, '', {gereqs: ['SED', 'WRI'], gereqMode: 'AND'}), [1]))
	it('keeps courses with any chosen GE', () =>
		assert.deepEqual(
			ascending(find(runner, '', {gereqs: ['SED', 'WRI'], gereqMode: 'OR'})),
			[1, 2],
		))
})

describe('filterOptionsQueries', () => {
	it('offers recent terms newest first, and the GEs and departments in them', () => {
		let runner = catalog(
			makeCourse({clbid: 1, term: 20211, year: 2021, department: 'OLD', gereqs: ['OLDGE']}),
			makeCourse({clbid: 2, term: 20261, year: 2026, department: 'MATH', gereqs: ['WRI']}),
			makeCourse({clbid: 3, term: 20262, year: 2026, department: 'ART', gereqs: ['SED', 'WRI']}),
		)
		let queries = filterOptionsQueries(2022)
		assert.deepEqual(
			runner.all<{term: number}>(queries.terms).map((row) => row.term),
			[20262, 20261],
		)
		assert.deepEqual(
			runner.all<{code: string}>(queries.gereqs).map((row) => row.code),
			['SED', 'WRI'],
		)
		assert.deepEqual(
			runner.all<{department: string}>(queries.departments).map((row) => row.department),
			['ART', 'MATH'],
		)
	})
})

describe('rows', () => {
	it('reads a list row with its lists in order, and none as absent', () => {
		let runner = catalog(
			makeCourse({
				clbid: 1,
				instructors: ['B', 'A'],
				notes: ['one', 'two'],
				gereqs: ['WRI', 'SED'],
			}),
			makeCourse({clbid: 2, instructors: [], notes: [], gereqs: []}),
		)
		let items = runner
			.all<CourseListRow>(courseResultsQuery({query: '', filters: NONE}))
			.map(listItem)
		let byId = new Map(items.map((item) => [item.clbid, item]))

		assert.deepEqual(byId.get(1)?.instructors, ['B', 'A'])
		assert.deepEqual(byId.get(1)?.notes, ['one', 'two'])
		assert.deepEqual(byId.get(1)?.gereqs, ['SED', 'WRI'])
		assert.equal(byId.get(1)?.number, 252)
		assert.equal(byId.get(2)?.instructors, undefined)
		assert.equal(byId.get(2)?.notes, undefined)
		assert.equal(byId.get(2)?.gereqs, undefined)
	})

	it('groups list items by term, keeping their order', () => {
		let item = (clbid: number, term: number): CourseListItem => ({
			clbid,
			term,
			name: '',
			department: 'X',
			number: 1,
			status: 'O',
		})
		let sections = sectionsByTerm([item(1, 20262), item(2, 20262), item(3, 20261)])
		assert.deepEqual(
			sections.map((section) => [section.title, section.data.map((entry) => entry.clbid)]),
			[
				['20262', [1, 2]],
				['20261', [3]],
			],
		)
	})

	it('rebuilds a whole course', () => {
		let original = makeCourse({
			clbid: 9,
			section: 'B',
			title: 'Algebra Again',
			prerequisites: 'MATH 220',
			pn: true,
			offerings: [
				{day: 'Mo', start: '10:00', end: '11:00', location: 'RNS 310'},
				{day: 'We', start: '10:00', end: '11:00', location: 'RNS 310'},
			],
			description: ['First.', 'Second.'],
			instructors: ['Zed', 'Amy'],
		})
		assert.deepEqual(readCourse(catalog(original), 9), {
			clbid: 9,
			credits: 1,
			crsid: 10,
			department: 'MATH',
			description: ['First.', 'Second.'],
			enrolled: 5,
			gereqs: ['WRI'],
			instructors: ['Zed', 'Amy'],
			level: 200,
			max: 20,
			name: 'Abstract Algebra',
			notes: ['Meets in RNS 310.'],
			number: 252,
			offerings: original.offerings,
			pn: true,
			prerequisites: 'MATH 220',
			section: 'B',
			semester: 1,
			spaceAvailable: true,
			status: 'O',
			term: 20261,
			title: 'Algebra Again',
			type: 'Research',
			year: 2026,
		})
	})

	it('rebuilds a course missing its optional fields', () => {
		let bare = makeCourse({clbid: 5, description: undefined})
		delete bare.offerings
		delete bare.credits
		delete bare.max
		delete bare.prerequisites
		let course = readCourse(catalog(bare), 5)
		assert.equal(course.prerequisites, false)
		assert.deepEqual(course.offerings, [])
		assert.equal(course.description, undefined)
		assert.equal(course.spaceAvailable, false)
		assert.equal(course.credits, 0)
	})
})
