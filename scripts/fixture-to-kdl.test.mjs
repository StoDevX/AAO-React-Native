import assert from 'node:assert/strict'
import {mkdtempSync, readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'

import {convertRecording} from './fixture-to-kdl.mjs'
import {kdlToJson} from './kdl-module.mjs'

test('writes a recording as KDL under its new key, and indexes the folder', () => {
	let dir = mkdtempSync(join(tmpdir(), 'kdl-'))
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

	assert.equal(written, join(out, 'GET-dictionary.kdl'))
	let value = kdlToJson(readFileSync(written, 'utf8'), written)
	assert.equal(value.key, 'GET {server:example.college}/dictionary')
	assert.equal(value.status, 200)
	assert.deepEqual(value.json, json)
	assert.deepEqual(readdirSync(out).sort(), ['GET-dictionary.kdl', 'index.ts'])
	assert.match(
		readFileSync(join(out, 'index.ts'), 'utf8'),
		/import f0 from '\.\/GET-dictionary\.kdl'/u,
	)
})
