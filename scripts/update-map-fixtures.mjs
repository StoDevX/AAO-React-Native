#!/usr/bin/env node

// Replaces the map fixtures the UI tests read with what each campus's
// ccc-server serves now, and says what changed. A campus whose response has
// no places stops the run before anything is written, so an outage cannot
// blank the map tests.

import {execFileSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {CAMPUSES, checkMap, renderFixture, summarizeChange} from './map-fixtures.mjs'

const FIXTURES = new URL('../source/features/map/__fixtures__/', import.meta.url)

async function fetchMap([campus, url]) {
	let response = await fetch(url)
	if (!response.ok) {
		throw new Error(`${campus}: ${url} responded with ${response.status}`)
	}
	let map = await response.json()
	checkMap(campus, map)
	return [campus, map]
}

// Every campus is fetched and checked before any file is written.
let maps = await Promise.all(Object.entries(CAMPUSES).map(fetchMap))

let written = []
for (let [campus, map] of maps) {
	let file = new URL(`${campus}-map.json`, FIXTURES)
	let before = JSON.parse(readFileSync(file, 'utf8'))
	let {added, removed, changed} = summarizeChange(before, map)
	writeFileSync(file, renderFixture(map))
	written.push(fileURLToPath(file))

	console.log(
		`${campus}: ${before.features.length} → ${map.features.length} places, ${changed} changed`,
	)
	if (added.length) console.log(`  added: ${added.join(', ')}`)
	if (removed.length) console.log(`  removed: ${removed.join(', ')}`)
}

// oxfmt lays the one-line JSON out as the repository formats it.
let oxfmt = fileURLToPath(new URL('../node_modules/.bin/oxfmt', import.meta.url))
execFileSync(oxfmt, written, {stdio: 'inherit'})
