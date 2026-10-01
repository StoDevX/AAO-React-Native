#!/usr/bin/env node

// Re-records Olaf Messenger's UI-test fixtures from a run of its UI tests: they
// run against the live paper with --record-fixtures, and every fetch they made
// becomes source/features/mess/__fixtures__/mess.json. Needs a booted simulator
// with the app installed, and Metro or an embedded bundle, as any UI test run.

import {execFileSync} from 'node:child_process'
import {existsSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {renderFixture} from './map-fixtures.mjs'
import {checkRecording, mergeRecordings, summarizeKeys} from './mess-fixtures.mjs'

const BUNDLE = 'NFMTHAZVS9.com.drewvolz.stolaf'
const FIXTURE = new URL('../source/features/mess/__fixtures__/mess.json', import.meta.url)
const RECORDING = 'Documents/fixture-recording.jsonl'

function run(command, args, options = {}) {
	return execFileSync(command, args, {encoding: 'utf8', ...options})
}

let booted = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'])).devices
let device = Object.values(booted).flat()[0]
if (!device) throw new Error('boot a simulator with the app installed first')
console.log(`recording on ${device.name} (${device.udid})`)

/** The recording's path: asked for each time, since the test run reinstalls the app. */
function recordingPath() {
	let container = run('xcrun', ['simctl', 'get_app_container', device.udid, BUNDLE, 'data'])
	return join(container.trim(), RECORDING)
}

// A recording left by an earlier run would mix two papers.
rmSync(recordingPath(), {force: true})

let build = [
	'-workspace',
	'ios/AllAboutOlaf.xcworkspace',
	'-scheme',
	'AllAboutOlaf',
	'-configuration',
	'Debug',
	'-sdk',
	'iphonesimulator',
	'-derivedDataPath',
	'ios/build',
	'-only-testing:AllAboutOlafUITests',
	'CODE_SIGN_IDENTITY=',
	'CODE_SIGNING_REQUIRED=NO',
	'CODE_SIGNING_ALLOWED=NO',
]
run('xcodebuild', ['build-for-testing', ...build], {stdio: 'inherit'})
let xctestrun = run('find', [
	'ios/build/Build/Products',
	'-name',
	'*.xctestrun',
	'-print',
	'-quit',
]).trim()
// A failed run throws here, before mess.json is touched.
run(
	'xcodebuild',
	[
		'test-without-building',
		'-xctestrun',
		xctestrun,
		'-destination',
		`platform=iOS Simulator,id=${device.udid}`,
		'-only-testing:AllAboutOlafUITests/ModuleNewsTests',
	],
	{stdio: 'inherit', env: {...process.env, TEST_RUNNER_AAO_RECORD_FIXTURES: '1'}},
)

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
