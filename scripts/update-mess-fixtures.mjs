#!/usr/bin/env node

// Re-records Olaf Messenger's UI-test fixtures from a run of its UI tests: they
// run against the live paper with --record-fixtures, and every fetch they made
// becomes source/features/mess/__fixtures__/mess.json. Needs a booted simulator
// with the app installed, and Metro or an embedded bundle, as any UI test run.

import {existsSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {renderFixture} from './map-fixtures.mjs'
import {checkRecording, mergeRecordings, summarizeKeys} from './mess-fixtures.mjs'
import {
	appDataPath,
	bootedSimulator,
	buildForTesting,
	findXctestrun,
	testWithoutBuilding,
} from './uitest-run.mjs'

const FIXTURE = new URL('../source/features/mess/__fixtures__/mess.json', import.meta.url)
const RECORDING = 'Documents/fixture-recording.jsonl'

let device = bootedSimulator()
console.log(`recording on ${device.name} (${device.udid})`)

/** The recording's path: asked for each time, since the test run reinstalls the app. */
function recordingPath() {
	let path = appDataPath(device.udid, RECORDING)
	if (!path) throw new Error('the app is not installed on this simulator')
	return path
}

// A recording left by an earlier run would mix two papers.
rmSync(recordingPath(), {force: true})

buildForTesting(device.udid)
// A failed run throws here, before mess.json is touched.
testWithoutBuilding({
	udid: device.udid,
	xctestrun: findXctestrun(),
	only: ['AllAboutOlafUITests/ModuleNewsTests'],
	env: {TEST_RUNNER_AAO_RECORD_FIXTURES: '1'},
})

let recording = recordingPath()
if (!existsSync(recording)) throw new Error('nothing was recorded; mess.json is left as it was')
let table = mergeRecordings(readFileSync(recording, 'utf8').split('\n'))
checkRecording(table)

let before = JSON.parse(readFileSync(FIXTURE, 'utf8'))
let {added, removed} = summarizeKeys(before, table)
writeFileSync(FIXTURE, renderFixture(table))
console.log(`mess: ${Object.keys(before).length} → ${Object.keys(table).length} fixtures`)
if (added.length) console.log(`  added:\n    ${added.join('\n    ')}`)
if (removed.length) console.log(`  removed:\n    ${removed.join('\n    ')}`)
