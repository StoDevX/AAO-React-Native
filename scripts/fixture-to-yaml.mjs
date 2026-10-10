#!/usr/bin/env node

// Starts a Wiki Monkeys fixture from a St. Olaf or Carleton recording: the
// same response, as YAML, under the key Wiki Monkeys asks it by. Its
// content is then rewritten by hand; see
// source/features/campus/__fixtures__/example.college/.

import {mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {dumpFixture} from './yaml-module.mjs'

import {fixtureFileName, fixtureIndex} from './campus-fixtures.mjs'

export const EXAMPLE_COLLEGE_FIXTURES = new URL(
	'../source/features/campus/__fixtures__/example.college/',
	import.meta.url,
).pathname

const INDEX_HEADER = '// Written by `mise run fixture-to-yaml`; lists every fixture in this folder.'

/** Rewrites `dir`'s index.ts to import every .yaml and .json file there. */
export function writeIndex(dir) {
	let names = readdirSync(dir).filter((name) => /\.(yaml|json)$/u.test(name))
	writeFileSync(join(dir, 'index.ts'), fixtureIndex(names, INDEX_HEADER))
}

/** Writes `recording` as `key`'s YAML fixture in `dir`, then reindexes `dir`. Returns the new file's path. */
export function convertRecording(recording, key, dir = EXAMPLE_COLLEGE_FIXTURES) {
	let record = {...JSON.parse(readFileSync(recording, 'utf8')), key}
	mkdirSync(dir, {recursive: true})
	let path = join(dir, fixtureFileName(key, '.yaml'))
	writeFileSync(path, dumpFixture(record))
	writeIndex(dir)
	return path
}

if (process.argv[1] === import.meta.filename) {
	let [recording, key] = process.argv.slice(2)
	if (!recording || !key) {
		console.error('usage: fixture-to-yaml <recording.json> "<METHOD> <key>"')
		process.exit(1)
	}
	console.log(convertRecording(recording, key))
}
