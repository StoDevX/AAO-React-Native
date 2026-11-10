import assert from 'node:assert/strict'
import {existsSync, readdirSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {describe, it} from 'node:test'
import {DATA_BASE} from './paths.mjs'
import {
	build,
	keysOf,
	lastError,
	listBuildings,
	problemsFrom,
	pruneBuilds,
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
	it('keeps a message that itself holds "; " in one problem', () => {
		let error = new Error(
			'/ws/data/breaks.yaml/breaks must be object; see the schema; /ws/data/breaks.yaml/timezone must be string',
		)
		assert.deepEqual(
			problemsFrom(error, dataDir).map((p) => p.message),
			['must be object; see the schema', 'must be string'],
		)
	})
	it('places an error in a workspace whose path has a space', () => {
		let spaced = '/Users/ole/Library/Application Support/DataEditor/workspace/data'
		let error = new Error(
			`${spaced}/building-hours/cage.yaml/schedule/0/to must match pattern "^x$"`,
		)
		assert.deepEqual(problemsFrom(error, spaced), [
			{
				file: 'building-hours/cage.yaml',
				message: 'must match pattern "^x$"',
				path: ['schedule', 0, 'to'],
			},
		])
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

const BUNDLE_DATA = path.join(import.meta.dirname, 'bundle-data.mjs')

describe('build', () => {
	it('writes a whole build into a fresh folder under outDir', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		let result = await build({bundleData: BUNDLE_DATA, dataDir, outDir})
		assert.equal(result.ok, true, JSON.stringify(result))
		assert.equal(path.dirname(result.dir), outDir)
		assert.ok(existsSync(path.join(result.dir, 'building-hours.json')))
		assert.ok(existsSync(path.join(result.dir, 'breaks.json')))
	})

	it('leaves the last good build alone when the data is broken', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		let good = await build({bundleData: BUNDLE_DATA, dataDir, outDir})
		let before = await readFile(path.join(good.dir, 'building-hours.json'), 'utf8')
		let file = path.join(dataDir, 'building-hours/1-1-cage.yaml')
		await writeFile(file, (await readFile(file, 'utf8')).replace("from: '7:30am'", "from: '7:30'"))
		let result = await build({bundleData: BUNDLE_DATA, dataDir, outDir})
		assert.equal(result.ok, false)
		assert.ok(
			result.problems.some((p) => p.file === 'building-hours/1-1-cage.yaml' && p.path !== null),
			JSON.stringify(result),
		)
		assert.equal(await readFile(path.join(good.dir, 'building-hours.json'), 'utf8'), before)
		assert.deepEqual(readdirSync(outDir), [path.basename(good.dir)])
	})

	it('removes every build but the one it keeps', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		let first = await build({bundleData: BUNDLE_DATA, dataDir, outDir})
		let second = await build({bundleData: BUNDLE_DATA, dataDir, outDir})
		await pruneBuilds(outDir, second.dir)
		assert.notEqual(first.dir, second.dir)
		assert.deepEqual(readdirSync(outDir), [path.basename(second.dir)])
	})

	it('leaves alone anything under outDir that is not a build', async () => {
		let {root, dataDir} = await scratchData()
		let outDir = path.join(root, 'out')
		let kept = await build({bundleData: BUNDLE_DATA, dataDir, outDir})
		await writeFile(path.join(outDir, 'notes.txt'), 'mine')
		await pruneBuilds(outDir, kept.dir)
		assert.deepEqual(readdirSync(outDir).sort(), [path.basename(kept.dir), 'notes.txt'].sort())
	})
})

describe('lastError', () => {
	it("reads Node's own error line, not its version banner", () => {
		let stderr = [
			'node:internal/modules/run_main:123',
			'    triggerUncaughtException(',
			'    ^',
			'',
			"Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'x' imported from /ws/scripts/bundle-data.mjs",
			'    at packageResolve (node:internal/modules/esm/resolve:873:9) {',
			"  code: 'ERR_MODULE_NOT_FOUND'",
			'}',
			'',
			'Node.js v24.22.0',
		].join('\n')
		assert.equal(
			lastError(stderr),
			"Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'x' imported from /ws/scripts/bundle-data.mjs",
		)
	})
	it('reads a validation error as its message alone', () => {
		assert.equal(
			lastError(
				'\nError: /ws/data/breaks.yaml/breaks must be object\n    at x\n\nNode.js v24.22.0\n',
			),
			'/ws/data/breaks.yaml/breaks must be object',
		)
	})
})
