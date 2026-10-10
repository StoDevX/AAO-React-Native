import assert from 'node:assert/strict'
import {test} from 'node:test'

import Ajv2020 from 'ajv/dist/2020.js'

import {inferSchema} from './infer-schema.mjs'

test('a property is required only when every sample has it', () => {
	let schema = inferSchema([{a: 1, b: 'x'}, {a: 2}])
	assert.deepEqual(schema.required, ['a'])
	assert.deepEqual(Object.keys(schema.properties).sort(), ['a', 'b'])
})

test("a key that only some samples have isn't required, even one Object.prototype has", () => {
	let schema = inferSchema([{constructor: 'x', a: 1}, {a: 2}])
	assert.deepEqual(schema.required, ['a'])
	assert.deepEqual(schema.properties.constructor, {type: 'string'})
})

test("an array's items merge across the array and across samples", () => {
	let schema = inferSchema([{list: [{x: 1}, {x: 2, y: true}]}, {list: [{x: 3}]}])
	let items = schema.properties.list.items
	assert.deepEqual(items.required, ['x'])
	assert.deepEqual(items.properties.y, {type: 'boolean'})
})

test('mismatched types become a union', () => {
	let schema = inferSchema([{v: 1}, {v: 'one'}, {v: null}])
	assert.deepEqual(
		[...schema.properties.v.type].sort((a, b) => a.localeCompare(b)),
		['null', 'number', 'string'],
	)
})

test('a union of an object and a scalar keeps the object whole', () => {
	let schema = inferSchema([{a: 1}, 'x'])
	assert.deepEqual(schema.anyOf, [
		{type: 'object', properties: {a: {type: 'number'}}, required: ['a']},
		{type: 'string'},
	])
})

test('an object keyed by numbers is a map of its merged values', () => {
	let schema = inferSchema([{items: {12: {label: 'Oats'}, 13: {label: 'Eggs', vegan: false}}}])
	let items = schema.properties.items
	assert.equal(items.properties, undefined)
	assert.deepEqual(items.additionalProperties.required, ['label'])
})

test('an empty array allows any item', () => {
	assert.deepEqual(inferSchema([[]]), {type: 'array', items: {}})
})

test('the result is a draft 2020-12 schema ajv enforces', () => {
	let validate = new Ajv2020().compile({
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		...inferSchema([{a: [1]}]),
	})
	assert.equal(validate({a: [2]}), true)
	assert.equal(validate({a: ['2']}), false)
	assert.equal(validate({}), false)
})
