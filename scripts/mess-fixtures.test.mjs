import assert from 'node:assert/strict'
import {test} from 'node:test'
import {checkRecording, mergeRecordings, pickSimulator, summarizeKeys} from './mess-fixtures.mjs'

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

let sim = (udid, name = udid) => ({udid, name})

test('pickSimulator takes the only booted simulator', () => {
	assert.equal(pickSimulator([sim('A')], undefined).udid, 'A')
})

test('pickSimulator takes the one named, booted or not among several', () => {
	assert.equal(pickSimulator([sim('A'), sim('B')], 'B').udid, 'B')
	assert.throws(() => pickSimulator([sim('A')], 'C'), /C is not booted/u)
})

// Several worktrees each boot their own; recording on the wrong one reinstalls
// another session's app.
test('pickSimulator refuses to guess among several', () => {
	assert.throws(() => pickSimulator([sim('A'), sim('B')], undefined), /SIMULATOR_UDID/u)
	assert.throws(() => pickSimulator([], undefined), /boot a simulator/u)
})
