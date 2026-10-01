import assert from 'node:assert/strict'
import {test} from 'node:test'
import {stubsFixture} from './metro-fixtures.mjs'

const MAP = '/repo/source/features/map/__fixtures__/stolaf-map.json'

test('a production bundle stubs a fixture', () => {
	assert.equal(stubsFixture(MAP, {dev: false, keep: false}), true)
})

test('a development bundle keeps it, as local UI tests read it through Metro', () => {
	assert.equal(stubsFixture(MAP, {dev: true, keep: false}), false)
})

test('a production bundle made for UI tests keeps it', () => {
	assert.equal(stubsFixture(MAP, {dev: false, keep: true}), false)
})

test('anything outside a __fixtures__ folder is left alone', () => {
	assert.equal(stubsFixture('/repo/docs/faqs.json', {dev: false, keep: false}), false)
	assert.equal(stubsFixture('/repo/data/__fixtures__notes.json', {dev: false, keep: false}), false)
})

// maps.ts lives beside the copies and imports them; only the data is stubbed.
test('code in a __fixtures__ folder is left alone', () => {
	assert.equal(
		stubsFixture('/repo/source/features/map/__fixtures__/maps.ts', {dev: false, keep: false}),
		false,
	)
})
