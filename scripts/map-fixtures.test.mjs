import assert from 'node:assert/strict'
import {test} from 'node:test'
import {checkMap, renderFixture, summarizeChange} from './map-fixtures.mjs'

let place = (id, properties = {}) => ({
	type: 'Feature',
	id,
	properties: {name: id, ...properties},
	geometry: null,
})

test('renderFixture writes one line with every key sorted, at every depth', () => {
	let map = {
		type: 'FeatureCollection',
		features: [{type: 'Feature', id: 'a', properties: {z: 1, a: 2}}],
	}
	assert.equal(
		renderFixture(map),
		'{"features":[{"id":"a","properties":{"a":2,"z":1},"type":"Feature"}],"type":"FeatureCollection"}\n',
	)
})

test('renderFixture leaves array order alone', () => {
	assert.equal(renderFixture({ids: ['b', 'a']}), '{"ids":["b","a"]}\n')
})

test('summarizeChange names the places added and removed, and counts the changed', () => {
	let before = {features: [place('a'), place('b', {length: 1}), place('c')]}
	let after = {features: [place('b', {length: 2}), place('c'), place('d')]}
	assert.deepEqual(summarizeChange(before, after), {added: ['d'], removed: ['a'], changed: 1})
})

test('summarizeChange counts a place as changed by value, not by key order', () => {
	let before = {features: [{id: 'a', properties: {x: 1, y: 2}}]}
	let after = {features: [{properties: {y: 2, x: 1}, id: 'a'}]}
	assert.deepEqual(summarizeChange(before, after), {added: [], removed: [], changed: 0})
})

// An outage or a moved endpoint answers with nothing to map; writing that
// over the fixture would blank every map test.
test('checkMap refuses a response with no places', () => {
	assert.throws(
		() => checkMap('stolaf', {type: 'FeatureCollection', features: []}),
		/stolaf: no places/u,
	)
	assert.throws(() => checkMap('stolaf', {error: 'down'}), /stolaf: no places/u)
})

test('checkMap passes a map with places', () => {
	assert.doesNotThrow(() => checkMap('stolaf', {features: [place('a')]}))
})
