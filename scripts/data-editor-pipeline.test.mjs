import assert from 'node:assert/strict'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {describe, it} from 'node:test'
import {DATA_BASE} from './paths.mjs'
import {
	keysOf,
	listBuildings,
	problemsFrom,
	readCalendar,
	validate,
} from './data-editor-pipeline.ts'
import {scratchData} from './data-editor-test-support.mjs'

describe('keysOf', () => {
	it('reads a JSON pointer', () => {
		assert.deepEqual(keysOf('/schedule/0/hours/1/to'), ['schedule', 0, 'hours', 1, 'to'])
	})
	it('reads a dotted path', () => {
		assert.deepEqual(keysOf('.breakSchedule.fall.schedule[0].notes'), [
			'breakSchedule',
			'fall',
			'schedule',
			0,
			'notes',
		])
	})
})

describe('problemsFrom', () => {
	let dataDir = '/ws/data'
	it('ties a schema error to its file and field', () => {
		let error = new Error(
			'/ws/data/building-hours/cage.yaml/schedule/0/hours/0/from must match pattern "^x$"',
		)
		assert.deepEqual(problemsFrom(error, dataDir), [
			{
				file: 'building-hours/cage.yaml',
				message: 'must match pattern "^x$"',
				path: ['schedule', 0, 'hours', 0, 'from'],
			},
		])
	})
	it('splits several errors', () => {
		let error = new Error(
			'/ws/data/breaks.yaml/breaks must be object; /ws/data/breaks.yaml/timezone must be string',
		)
		assert.equal(problemsFrom(error, dataDir).length, 2)
	})
	it('reads a break-message error', () => {
		let error = new Error(
			'/ws/data/building-hours/cage.yaml.breakSchedule.fall.schedule[0].notes: break closure messages must not end with a period',
		)
		let [problem] = problemsFrom(error, dataDir)
		assert.deepEqual(problem.path, ['breakSchedule', 'fall', 'schedule', 0, 'notes'])
		assert.equal(problem.message, 'break closure messages must not end with a period')
	})
	it('keeps an error it cannot place', () => {
		assert.deepEqual(problemsFrom(new Error('something else'), dataDir), [
			{file: null, message: 'something else', path: null},
		])
	})
})

describe('validate', () => {
	it('finds nothing wrong with the repo data', async () => {
		let {dataDir} = await scratchData()
		assert.deepEqual(validate(dataDir, 'building-hours/1-1-cage.yaml'), [])
	})
	it('places a bad time', async () => {
		let {dataDir} = await scratchData()
		let file = path.join(dataDir, 'building-hours/1-1-cage.yaml')
		await writeFile(file, (await readFile(file, 'utf8')).replace("from: '7:30am'", "from: '7:30'"))
		let problems = validate(dataDir, 'building-hours/1-1-cage.yaml')
		assert.ok(
			problems.some(
				(p) =>
					p.file === 'building-hours/1-1-cage.yaml' &&
					p.path?.slice(0, 4).join('/') === 'schedule/0/hours/0',
			),
			JSON.stringify(problems),
		)
	})
})

describe('listBuildings', () => {
	it('lists every hours file with its name and category, in order', () => {
		let buildings = listBuildings(DATA_BASE)
		assert.ok(
			buildings.some(
				(b) =>
					b.file === 'building-hours/1-1-cage.yaml' &&
					b.name === 'The Cage' &&
					b.category === 'Food',
			),
		)
		let keys = buildings.map((b) => `${b.category}\u0000${b.name}`)
		assert.deepEqual(
			keys,
			[...keys].sort((a, b) => a.localeCompare(b)),
		)
	})
})

describe('readCalendar', () => {
	it('lists the breaks and the template names', () => {
		let calendar = readCalendar(DATA_BASE)
		assert.ok(
			calendar.breaks.some((b) => b.key === 'weekOne' && b.name === 'New Student Orientation'),
		)
		assert.ok(calendar.templates.includes('library-fall-closed'))
	})
})
