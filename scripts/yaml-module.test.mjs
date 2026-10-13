import assert from 'node:assert/strict'
import {test} from 'node:test'
import {runInNewContext} from 'node:vm'

import {yamlModuleSource, yamlToJson} from './yaml-module.mjs'

const CAFE = `key: GET {server:example.college}/food/named/cafe/treeline-commons
status: 200
contentType: application/json
json:
  name: Treeline Commons
  open: true
  rating: null
  opened: 2026-10-09
  stations: [Grill]
  menu:
    - {label: Pancakes, price: 3.5}
    - {label: Oatmeal, price: 2}
`

test('reads YAML as the JSON it describes', () => {
	assert.deepEqual(yamlToJson(CAFE, 'cafe.yaml'), {
		key: 'GET {server:example.college}/food/named/cafe/treeline-commons',
		status: 200,
		contentType: 'application/json',
		json: {
			name: 'Treeline Commons',
			open: true,
			rating: null,
			opened: '2026-10-09',
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
	runInNewContext(yamlModuleSource(CAFE, 'cafe.yaml'), {module})
	assert.equal(module.exports.json.name, 'Treeline Commons')
})

test('a broken file is refused by name', () => {
	assert.throws(() => yamlToJson('json: {', 'broken.yaml'), /broken\.yaml/u)
})
