import assert from 'node:assert/strict'
import {test} from 'node:test'

import {dedupeFindings, renderSummary, topFrame} from './chaos-findings.mjs'

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
