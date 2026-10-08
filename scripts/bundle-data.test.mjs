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
	it('publishes authored policies while preserving normal hours and space exceptions', () => {
		withInputs(({toDir, calendar, spaces, run}) => {
			let result = run()
			assert.equal(result.status, 0, result.stderr)
			let hours = readJson(toDir, 'building-hours.json')
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
				hours.map(({breakSchedule: _breakSchedule, ...fields}) => fields),
				spaces.map(({breakSchedule: _breakSchedule, ...fields}) => ({
					...fields,
					exceptions: fields.exceptions ?? [],
				})),
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
			assert.equal(existsSync(join(toDir, 'building-hours-authored.json')), false)
			for (let name of ['building-hours.json', 'breaks.json']) {
				assert.ok(readFileSync(join(toDir, name), 'utf8').endsWith('\n'))
			}
		})
	})

	it('publishes explicit normal exceptions and additive metadata inside data envelopes', () => {
		withInputs(({toDir, calendar, spaces, calendarFile, spaceFiles, run}) => {
			calendar.futureMetadata = {revision: 2}
			calendar.templates.closed = {schedule: calendar.templates.closed, attribution: 'Example'}
			spaces[1].futureMetadata = ['retained']
			writeYaml(calendarFile, calendar)
			writeYaml(spaceFiles[1], spaces[1])
			assert.equal(run().status, 0)
			let hours = JSON.parse(readFileSync(join(toDir, 'building-hours.json'), 'utf8'))
			let breaks = JSON.parse(readFileSync(join(toDir, 'breaks.json'), 'utf8'))
			assert.deepEqual(Object.keys(hours), ['data'])
			assert.deepEqual(Object.keys(breaks), ['data'])
			assert.deepEqual(hours.data[1].exceptions, [])
			assert.deepEqual(hours.data[1].futureMetadata, ['retained'])
			assert.deepEqual(breaks.data.futureMetadata, {revision: 2})
			assert.deepEqual(breaks.data.templates.closed, {...calendar.templates.closed, exceptions: []})
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
			let hours = readJson(toDir, 'building-hours.json')
			assert.deepEqual(
				hours.map((space) => space.name),
				['First', spaces[0].name, spaces[1].name],
			)
			assert.equal(Object.hasOwn(hours[1], 'breakSchedule'), false)
		})
	})

	it('removes the retired authored feed after successful validation', () => {
		withInputs(({toDir, run}) => {
			mkdirSync(toDir)
			writeFileSync(join(toDir, 'building-hours-authored.json'), 'obsolete feed\n')
			assert.equal(run().status, 0)
			assert.equal(existsSync(join(toDir, 'building-hours-authored.json')), false)
			assert.ok(readJson(toDir, 'building-hours.json')[0].breakSchedule)
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

	it('retains the last successfully published tree after a later validation failure', () => {
		withInputs(({toDir, spaces, spaceFiles, run}) => {
			assert.equal(run().status, 0)
			let before = contentsIn(toDir)
			spaces[1].breakSchedule = {fall: 'winter', winter: 'fall'}
			writeYaml(spaceFiles[1], spaces[1])
			let result = run()
			assert.equal(result.status, 1)
			assert.match(result.stderr, /cyclic break reference/u)
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
		'rejects duplicate space names before replacing prior artifacts',
		({spaces, spaceFiles}) => {
			spaces[1].name = spaces[0].name
			writeYaml(spaceFiles[1], spaces[1])
		},
		/duplicate space name/u,
	)
	invalid(
		'rejects partial overlaps before replacing prior artifacts',
		({calendar, calendarFile}) => {
			calendar.breaks.other = {name: 'Other', start: '2026-10-12', end: '2026-10-16'}
			writeYaml(calendarFile, calendar)
		},
		/partially overlaps/u,
	)
	invalid(
		'rejects unused authored definitions before replacing prior artifacts',
		({calendar, calendarFile}) => {
			calendar.breaks.spring.templates['office-hours'].exceptions.push(
				structuredClone(calendar.breaks.spring.templates['office-hours'].exceptions[0]),
			)
			writeYaml(calendarFile, calendar)
		},
		/duplicate exception date/u,
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
