import assert from 'node:assert/strict'
import {test} from 'node:test'
import {runInNewContext} from 'node:vm'

import {kdlModuleSource, kdlToJson} from './kdl-module.mjs'

const CAFE = `(object)- {
	key "GET {server:example.college}/food/named/cafe/treeline-commons"
	status 200
	contentType "application/json"
	json {
		name "Treeline Commons"
		open #true
		rating #null
		(array)stations "Grill"
		menu {
			- { label "Pancakes"; price 3.5 }
			- { label "Oatmeal"; price 2 }
		}
	}
}`

test('reads JSON-in-KDL as the JSON it describes', () => {
	assert.deepEqual(kdlToJson(CAFE, 'cafe.kdl'), {
		key: 'GET {server:example.college}/food/named/cafe/treeline-commons',
		status: 200,
		contentType: 'application/json',
		json: {
			name: 'Treeline Commons',
			open: true,
			rating: null,
			stations: ['Grill'],
			menu: [
				{label: 'Pancakes', price: 3.5},
				{label: 'Oatmeal', price: 2},
			],
		},
	})
})

test('a module exports that value', () => {
	let module = {exports: {}}
	runInNewContext(kdlModuleSource(CAFE, 'cafe.kdl'), {module})
	assert.equal(module.exports.json.name, 'Treeline Commons')
})

test('a broken file is refused by name', () => {
	assert.throws(() => kdlToJson('(object)- {', 'broken.kdl'), /broken\.kdl/u)
})
