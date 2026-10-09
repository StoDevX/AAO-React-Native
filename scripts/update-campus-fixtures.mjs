#!/usr/bin/env node

// Re-records a campus's UI-test fixtures from a run of its campus tests: they
// run against the live servers with --record-fixtures, and every response
// becomes a file in source/features/campus/__fixtures__/<domain>/. Needs a booted
// simulator, and Metro or an embedded bundle, as any UI test run.

import {existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {
	campusDay,
	campusFixtureFiles,
	completeTecPages,
	failedKeys,
	mergeCampusRecordings,
	shiftCalendars,
} from './campus-fixtures.mjs'
import {summarizeKeys} from './mess-fixtures.mjs'
import {
	appDataPath,
	bootedSimulator,
	buildForTesting,
	findXctestrun,
	testWithoutBuilding,
} from './uitest-run.mjs'

/** Each campus's smoke-test class, by domain. */
const SMOKE_CLASSES = {'stolaf.edu': 'StOlafSmokeTests', 'carleton.edu': 'CarletonSmokeTests'}

let args = process.argv.slice(2)
let allowLarge = args.includes('--allow-large')
let domain = args.find((arg) => !arg.startsWith('--'))
if (!domain || !(domain in SMOKE_CLASSES)) {
	console.error(
		`usage: update-campus-fixtures <${Object.keys(SMOKE_CLASSES).join('|')}> [--allow-large]`,
	)
	process.exit(1)
}

const FIXTURES = new URL(`../source/features/campus/__fixtures__/${domain}/`, import.meta.url)
	.pathname
const RECORDING = 'Documents/campus-fixture-recording.jsonl'

let device = bootedSimulator()
console.log(`recording ${domain} on ${device.name} (${device.udid})`)

/** The recording's path: asked for each time, since the test run reinstalls the app. */
function recordingPath() {
	let path = appDataPath(device.udid, RECORDING)
	if (!path) throw new Error('the app is not installed on this simulator')
	return path
}

// A recording left by an earlier run would mix two runs.
rmSync(recordingPath(), {force: true})

buildForTesting(device.udid)
// A failed run throws here, before the fixture is touched.
testWithoutBuilding({
	udid: device.udid,
	xctestrun: findXctestrun(),
	only: [`AllAboutAnythingUITests/${SMOKE_CLASSES[domain]}`],
	env: {TEST_RUNNER_AAO_RECORD_FIXTURES: '1'},
})

let recording = recordingPath()
if (!existsSync(recording)) {
	throw new Error(`nothing was recorded; ${domain}'s fixtures are left as they were`)
}
/** The UI tests' frozen day, read from `UITEST_FROZEN_DATE` so the two cannot drift. */
function frozenDay() {
	let source = readFileSync('modules/timer/index.ts', 'utf8')
	let day = /UITEST_FROZEN_DATE = '(\d{4}-\d{2}-\d{2})/u.exec(source)?.[1]
	if (!day) throw new Error('no UITEST_FROZEN_DATE in modules/timer/index.ts')
	return day
}

/** A page of a feed, fetched live, as a recording holds it. */
async function fetchPage(url) {
	let response = await fetch(url)
	return {
		status: response.status,
		contentType: response.headers.get('content-type'),
		body: await response.text(),
	}
}

let recorded = mergeCampusRecordings(readFileSync(recording, 'utf8').split('\n'), {allowLarge})
let table = shiftCalendars(await completeTecPages(recorded, fetchPage, {allowLarge}), {
	frozenDay: frozenDay(),
	recordedDay: campusDay(new Date()),
})

/** The keys of the recordings already on disk, so the summary can say what moved. */
function recordedKeys() {
	if (!existsSync(FIXTURES)) return {}
	let names = readdirSync(FIXTURES).filter((name) => name.endsWith('.json'))
	return Object.fromEntries(
		names.map((name) => [JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')).key, true]),
	)
}

let before = recordedKeys()
let {added, removed} = summarizeKeys(before, table)
// Every file goes, then the new set is written: a request no test makes now leaves no file behind.
rmSync(FIXTURES, {recursive: true, force: true})
mkdirSync(FIXTURES, {recursive: true})
let {files, index} = campusFixtureFiles(table)
for (let [name, text] of Object.entries(files)) writeFileSync(join(FIXTURES, name), text)
writeFileSync(join(FIXTURES, 'index.ts'), index)
console.log(`${domain}: ${Object.keys(before).length} → ${Object.keys(table).length} recordings`)
if (added.length) console.log(`  added:\n    ${added.join('\n    ')}`)
if (removed.length) console.log(`  removed:\n    ${removed.join('\n    ')}`)
let failed = failedKeys(table)
if (failed.length) {
	console.log(`  answered with an error, recorded as it came:\n    ${failed.join('\n    ')}`)
}
