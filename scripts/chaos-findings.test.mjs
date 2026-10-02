import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {after, test} from 'node:test'

import {dedupeFindings, renderSummary, summarise, topFrame} from './chaos-findings.mjs'

let line = (kind, message, stack = null) =>
	JSON.stringify({kind, message, stack, at: '2026-10-01T00:00:00Z'})

test('takes the first frame of a stack', () => {
	assert.equal(
		topFrame('Error: boom\n    at render (menus.tsx:10:4)\n    at x'),
		'at render (menus.tsx:10:4)',
	)
	assert.equal(topFrame(null), '')
})

test('merges the same bug found by several seeds', () => {
	let stack = 'Error: boom\n    at render (menus.tsx:10:4)'
	let found = dedupeFindings([
		{seed: 1, lines: [line('fatal', 'boom', stack)]},
		{seed: 2, lines: [line('fatal', 'boom', stack), line('console-error', 'noise')]},
		{seed: 3, lines: [line('unhandled-rejection', 'other')]},
	])
	assert.deepEqual(found, [
		{kind: 'fatal', message: 'boom', frame: 'at render (menus.tsx:10:4)', seeds: [1, 2]},
		{kind: 'unhandled-rejection', message: 'other', frame: '', seeds: [3]},
	])
})

test('skips a torn line', () => {
	assert.deepEqual(dedupeFindings([{seed: 1, lines: ['{"kind":"fat']}]), [])
})

test('says when nothing was found', () => {
	assert.match(renderSummary([]), /no stopping findings/iu)
})

test('lists each finding with its seeds', () => {
	let summary = renderSummary([{kind: 'fatal', message: 'boom', frame: 'at x', seeds: [1, 2]}])
	assert.match(summary, /boom/u)
	assert.match(summary, /mise run chaos -- --replay logs\/chaos\/1/u)
})

test("counts the monkey's stop reason as a finding of its own kind", () => {
	let found = dedupeFindings([
		{seed: 1, lines: [], stopReason: 'hang: nothing to press for 15 seconds'},
		{seed: 2, lines: [], stopReason: 'hang: nothing to press for 15 seconds'},
		{seed: 3, lines: [], stopReason: null},
	])
	assert.deepEqual(found, [
		{kind: 'stop', message: 'hang: nothing to press for 15 seconds', frame: '', seeds: [1, 2]},
	])
})

test('drops a JS stop reason that only restates a finding already read from the findings file', () => {
	let found = dedupeFindings([
		{seed: 1, lines: [line('fatal', 'boom')], stopReason: 'js: fatal: boom'},
	])
	assert.deepEqual(found, [{kind: 'fatal', message: 'boom', frame: '', seeds: [1]}])
})

test('keeps a monkey-only stop reason, which the app never saw to write down', () => {
	let found = dedupeFindings([
		{seed: 1, lines: [line('fatal', 'boom')], stopReason: 'native crash: the app is not running'},
	])
	assert.deepEqual(found, [
		{kind: 'fatal', message: 'boom', frame: '', seeds: [1]},
		{kind: 'stop', message: 'native crash: the app is not running', frame: '', seeds: [1]},
	])
})

/** A directory of chaos runs, each given as {name: {file: contents}}. */
function runsRoot(runs) {
	let root = mkdtempSync(join(tmpdir(), 'chaos-findings-'))
	after(() => rmSync(root, {recursive: true}))
	for (let [name, files] of Object.entries(runs)) {
		mkdirSync(join(root, name))
		for (let [file, contents] of Object.entries(files)) {
			writeFileSync(join(root, name, file), contents)
		}
	}
	return root
}

test('summarises the stops in outcome.json alongside the findings files', () => {
	let root = runsRoot({
		11: {'chaos-findings.jsonl': line('fatal', 'boom') + '\n'},
		12: {
			'outcome.json': JSON.stringify({
				exitCode: 1,
				message: 'chaos found something',
				stopReason: 'native crash: the app is not running',
			}),
		},
	})
	let summary = summarise(root)
	assert.match(summary, /\*\*fatal\*\*: boom .*seeds 11/u)
	assert.match(summary, /\*\*stop\*\*: native crash: the app is not running .*seeds 12/u)
})

test('says no run produced results when there is no runs directory', () => {
	assert.match(summarise(join(tmpdir(), 'no-such-chaos-runs')), /no chaos run produced results/iu)
})

test('says no run produced results when the runs directory is empty', () => {
	assert.match(summarise(runsRoot({})), /no chaos run produced results/iu)
})
