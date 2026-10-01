import assert from 'node:assert/strict'
import {test} from 'node:test'
import {checkRecording, mergeRecordings, summarizeKeys} from './mess-fixtures.mjs'

let line = (entry) => JSON.stringify(entry)

test('mergeRecordings keys each fetch by format and URL', () => {
	let table = mergeRecordings([
		line({href: 'https://x/a', format: 'json', body: [1]}),
		line({href: 'https://x/a', format: 'text', body: '<p>'}),
		'',
	])
	assert.deepEqual(table, {'json https://x/a': [1], 'text https://x/a': '<p>'})
})

test('mergeRecordings keeps a failure as its status', () => {
	let table = mergeRecordings([line({href: 'https://x/p9', format: 'json', status: 400})])
	assert.deepEqual(table, {'json https://x/p9': {status: 400}})
})

test('mergeRecordings keeps the last answer for a URL fetched twice', () => {
	let table = mergeRecordings([
		line({href: 'https://x/a', format: 'json', body: [1]}),
		line({href: 'https://x/a', format: 'json', body: [2]}),
	])
	assert.deepEqual(table, {'json https://x/a': [2]})
})

test('summarizeKeys names the fixtures added and removed', () => {
	assert.deepEqual(summarizeKeys({a: 1, b: 1}, {b: 2, c: 1}), {added: ['c'], removed: ['a']})
})

test('checkRecording refuses an empty recording', () => {
	assert.throws(() => checkRecording({}), /nothing was recorded/u)
	assert.doesNotThrow(() => checkRecording({'json https://x/a': [1]}))
})
