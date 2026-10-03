// The chaos engine's halves share names they cannot import from one another:
// the app's TypeScript, this runner's JavaScript, and the UI tests' Swift.
// Each copy is read here as text, so a change to one fails until the others
// follow.

import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

import {FINDINGS_FILE, STOPPING_FINDING_KINDS, TAPE_FILE_PATTERN, tapeFiles} from './chaos-run.mjs'

function source(path) {
	return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

/** The one capture of `pattern` in `text`, failing when there is none. */
function capture(text, pattern, what) {
	let match = pattern.exec(text)
	assert.ok(match, `could not find ${what}`)
	return match[1]
}

/** A TypeScript `export const NAME = '...'` string's value. */
function tsString(text, name) {
	return capture(text, new RegExp(`export const ${name} = '([^']*)'`, 'u'), name)
}

/** The body of the Swift `enum Chaos` in TestIdentifiers.swift. */
function swiftChaosEnum() {
	return capture(
		source('uitests/TestIdentifiers.swift'),
		/\n\tenum Chaos \{\n([\s\S]*?)\n\t\}\n/u,
		'TestIdentifiers.Chaos',
	)
}

/** A `static let name = "..."` string's value in TestIdentifiers.Chaos. */
function swiftString(name) {
	return capture(
		swiftChaosEnum(),
		new RegExp(`static let ${name} = "([^"]*)"`, 'u'),
		`TestIdentifiers.Chaos.${name}`,
	)
}

test('the runner stops on the same finding kinds as the app', () => {
	let list = capture(
		source('source/chaos/findings.ts'),
		/const STOPPING: ReadonlyArray<FindingKind> = \[([^\]]*)\]/u,
		'STOPPING in findings.ts',
	)
	let kinds = [...list.matchAll(/'([^']*)'/gu)].map((match) => match[1])
	assert.deepEqual(new Set(kinds), STOPPING_FINDING_KINDS)
})

test('the runner collects the findings file the app writes', () => {
	assert.equal(tsString(source('source/chaos/findings.ts'), 'FINDINGS_FILE'), FINDINGS_FILE)
})

test('the runner collects every tape the app writes', () => {
	let template = capture(
		source('source/chaos/tape.ts'),
		/export function tapeFile\(launch: number\): string \{\n\treturn `([^`]*)`/u,
		'tapeFile in tape.ts',
	)
	for (let launch of [0, 7, 120]) {
		let name = template.replace('${launch}', String(launch))
		assert.equal(TAPE_FILE_PATTERN.exec(name)?.[1], String(launch), name)
		assert.deepEqual(tapeFiles([name]), [name])
	}
})

test('the UI tests look for the beacon and boundary the app draws', () => {
	let identifiers = source('source/chaos/identifiers.ts')
	assert.equal(tsString(identifiers, 'BEACON_ID'), swiftString('beacon'))
	assert.equal(tsString(identifiers, 'BEACON_QUIET'), swiftString('beaconQuiet'))
	assert.equal(tsString(identifiers, 'FATAL_BOUNDARY_ID'), swiftString('fatalBoundary'))
})
