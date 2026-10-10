import assert from 'node:assert/strict'
import {mkdtempSync, readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'

import {convertRecording} from './fixture-to-yaml.mjs'
import {yamlToJson} from './yaml-module.mjs'

test('writes a recording as YAML under its new key, and indexes the folder', () => {
	let dir = mkdtempSync(join(tmpdir(), 'yaml-'))
	let recording = join(dir, 'GET-dictionary.json')
	let json = {data: [{word: 'Stav', definition: 'x', tags: [], note: null, count: 2.5}]}
	writeFileSync(
		recording,
		JSON.stringify({
			key: 'GET {server:edu.stolaf}/dictionary',
			status: 200,
			contentType: 'application/json',
			json,
		}),
	)
	let out = join(dir, 'example.college')
	let written = convertRecording(recording, 'GET {server:example.college}/dictionary', out)

	assert.equal(written, join(out, 'GET-dictionary.yaml'))
	let value = yamlToJson(readFileSync(written, 'utf8'), written)
	assert.equal(value.key, 'GET {server:example.college}/dictionary')
	assert.equal(value.status, 200)
	assert.deepEqual(value.json, json)
	assert.deepEqual(readdirSync(out).sort(), ['GET-dictionary.yaml', 'index.ts'])
	assert.match(
		readFileSync(join(out, 'index.ts'), 'utf8'),
		/import f0 from '\.\/GET-dictionary\.yaml'/u,
	)
})
