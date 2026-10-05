import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {describe, it} from 'node:test'
import {load} from 'js-yaml'

let script = fileURLToPath(new URL('bundle-data.mjs', import.meta.url))
let fixture = (name) =>
	load(readFileSync(new URL(`fixtures/schedules/${name}.yaml`, import.meta.url), 'utf8'))
let writeYaml = (filename, data) => writeFileSync(filename, JSON.stringify(data))
let readJson = (dir, name) => JSON.parse(readFileSync(join(dir, name), 'utf8')).data

/** Runs the actual bundler against isolated inputs and output files. */
function withInputs(work) {
	let root = mkdtempSync(join(tmpdir(), 'aao-bundle-schedules-'))
	let fromDir = join(root, 'data')
	let toDir = join(root, 'output')
	mkdirSync(join(fromDir, 'building-hours'), {recursive: true})
	let calendar = fixture('calendar')
	let spaces = fixture('spaces')
	let calendarFile = join(fromDir, 'breaks.yaml')
	let spaceFiles = [
		join(fromDir, 'building-hours', '2-office.yaml'),
		join(fromDir, 'building-hours', '10-building.yaml'),
	]
	writeYaml(calendarFile, calendar)
	spaces.forEach((space, index) => writeYaml(spaceFiles[index], space))
	let run = () => spawnSync(process.execPath, [script, fromDir, toDir], {encoding: 'utf8'})
	try {
		work({fromDir, toDir, calendar, spaces, calendarFile, spaceFiles, run})
	} finally {
		rmSync(root, {recursive: true, force: true})
	}
}

/** Captures the whole generated tree to catch writes beyond schedule outputs. */
function contentsIn(dir) {
	return Object.fromEntries(
		readdirSync(dir, {recursive: true, withFileTypes: true})
			.filter((entry) => entry.isFile())
			.map((entry) => [
				join(entry.parentPath, entry.name),
				readFileSync(join(entry.parentPath, entry.name)),
			]),
	)
}

describe('schedule bundling', () => {
	it('publishes unresolved schedules and a compatible feed with normal hours and exceptions', () => {
		withInputs(({toDir, calendar, spaces, run}) => {
			let result = run()
			assert.equal(result.status, 0, result.stderr)
			let hours = readJson(toDir, 'building-hours-authored.json')
			assert.deepEqual(
				hours.map((space) => space.name),
				spaces.map((space) => space.name),
			)
			assert.equal(hours[0].breakSchedule.easter, 'spring')
			assert.equal(hours[0].breakSchedule.fall, 'inherit')
			assert.equal(hours[0].breakSchedule.winter, 'normal')
			assert.equal(hours[0].breakSchedule.spring, 'office-hours')
			assert.deepEqual(hours[1].breakSchedule.fall, {
				schedule: spaces[1].breakSchedule.fall,
				exceptions: [],
			})
			assert.deepEqual(hours[0].breakSchedule.interim, spaces[0].breakSchedule.interim)
			assert.deepEqual(
				readJson(toDir, 'building-hours.json'),
				spaces.map(({breakSchedule: _breakSchedule, ...fields}) => fields),
			)
			let breaks = readJson(toDir, 'breaks.json')
			assert.equal(breaks.timezone, calendar.timezone)
			assert.equal(breaks.breaks.fall.defaultSpaceSchedule, 'closed')
			assert.deepEqual(breaks.templates.closed, {
				schedule: calendar.templates.closed,
				exceptions: [],
			})
			assert.deepEqual(
				breaks.breaks.spring.templates['office-hours'],
				calendar.breaks.spring.templates['office-hours'],
			)
			assert.deepEqual(breaks.breaks.easter, calendar.breaks.easter)
			for (let name of ['building-hours.json', 'building-hours-authored.json', 'breaks.json']) {
				assert.ok(readFileSync(join(toDir, name), 'utf8').endsWith('\n'))
			}
		})
	})

	it('keeps absent break entries absent and preserves numeric file order', () => {
		withInputs(({fromDir, toDir, spaces, spaceFiles, run}) => {
			delete spaces[0].breakSchedule
			writeYaml(spaceFiles[0], spaces[0])
			writeYaml(join(fromDir, 'building-hours', '1-first.yaml'), {...spaces[1], name: 'First'})
			writeFileSync(join(fromDir, 'building-hours', '_unfinished.yaml'), 'invalid: [')
			writeFileSync(join(fromDir, 'building-hours', '.DS_Store'), 'junk')
			let result = run()
			assert.equal(result.status, 0, result.stderr)
			let hours = readJson(toDir, 'building-hours-authored.json')
			assert.deepEqual(
				hours.map((space) => space.name),
				['First', spaces[0].name, spaces[1].name],
			)
			assert.equal(Object.hasOwn(hours[1], 'breakSchedule'), false)
		})
	})

	it('produces identical schedule files on repeated runs', () => {
		withInputs(({toDir, run}) => {
			assert.equal(run().status, 0)
			let before = contentsIn(toDir)
			assert.equal(run().status, 0)
			assert.deepEqual(contentsIn(toDir), before)
		})
	})

	let invalid = (name, mutate, message) =>
		it(name, () => {
			withInputs((input) => {
				let {fromDir, toDir, run} = input
				mkdirSync(toDir)
				for (let name of [
					'building-hours.json',
					'building-hours-authored.json',
					'breaks.json',
					'sentinel.json',
				]) {
					writeFileSync(join(toDir, name), `original ${name}\n`)
				}
				// An unrelated directory must not be bundled before schedule validation.
				mkdirSync(join(fromDir, 'a-first'))
				writeYaml(join(fromDir, 'a-first', '1-entry.yaml'), {title: 'Unrelated'})
				let before = contentsIn(toDir)
				mutate(input)
				let result = run()
				assert.equal(result.status, 1, result.stderr)
				assert.match(result.stderr, message)
				assert.deepEqual(contentsIn(toDir), before)
			})
		})

	invalid(
		'leaves every existing output untouched when a later space has invalid YAML',
		({spaceFiles}) => writeFileSync(spaceFiles[1], 'schedule: ['),
		/10-building.yaml/u,
	)
	invalid(
		'rejects invalid service blocks before writing any output',
		({spaces, spaceFiles}) => {
			spaces[1].schedule[0].hours = []
			writeYaml(spaceFiles[1], spaces[1])
		},
		/10-building.yaml/u,
	)
	invalid(
		'rejects cross-file reference cycles before writing any output',
		({spaces, spaceFiles}) => {
			spaces[1].breakSchedule = {fall: 'winter', winter: 'fall'}
			writeYaml(spaceFiles[1], spaces[1])
		},
		/cyclic break reference/u,
	)
	invalid(
		'rejects invalid calendar dates before writing any output',
		({calendar, calendarFile}) => {
			calendar.breaks.easter.date = '2027-02-30'
			writeYaml(calendarFile, calendar)
		},
		/breaks.yaml/u,
	)
	invalid(
		'requires a paired calendar rather than publishing unchecked hours',
		({calendarFile}) => rmSync(calendarFile),
		/breaks.yaml/u,
	)

	it('does not create an output directory when schedule validation fails', () => {
		withInputs(({toDir, spaces, spaceFiles, run}) => {
			spaces[1].breakSchedule = {fal: 'normal'}
			writeYaml(spaceFiles[1], spaces[1])
			let result = run()
			assert.equal(result.status, 1)
			assert.match(result.stderr, /unknown break key/u)
			assert.equal(existsSync(toDir), false)
		})
	})
})
