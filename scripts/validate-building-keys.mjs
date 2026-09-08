#!/usr/bin/env node

// Proves every `building:` key in data/building-hours/ resolves against the
// published campus geojson. The schema only checks that the key looks like an
// id (lowercase, hyphenated); it cannot know whether that id actually exists,
// so a typo like "buntrok" would pass validate-data and then simply never get
// a pin. This is the check that catches that.
//
// It cannot catch a key that resolves to the WRONG feature -- lot-skoglund is
// a real id, so a key pointing at it passes here even though it names a car
// park, not a building. That kind of error needs a human who knows the
// campus, which is what the building-key mapping this data came from is for.

import fs from 'node:fs'
import path from 'node:path'
import {load as loadYaml} from 'js-yaml'
import {isNotJunk} from './junk.mjs'
import {DATA_BASE} from './paths.mjs'

const GEOJSON_URL = 'https://stolaf.api.frogpond.tech/v1/map/geojson'
const BUILDING_HOURS_DIR = path.join(DATA_BASE, 'building-hours')

// Exit codes distinguish "could not check" from "checked and it's wrong",
// so a caller (the CI job) can treat a network blip differently from an
// actual bad key.
const EXIT_OK = 0
const EXIT_INVALID_KEY = 1
const EXIT_UNREACHABLE = 2

async function fetchFeatureIds() {
	let response
	try {
		response = await fetch(GEOJSON_URL)
	} catch (err) {
		throw new UnreachableError(`could not reach ${GEOJSON_URL}: ${err.message}`)
	}

	if (!response.ok) {
		throw new UnreachableError(`${GEOJSON_URL} responded with ${response.status}`)
	}

	let geojson
	try {
		geojson = await response.json()
	} catch (err) {
		throw new UnreachableError(`${GEOJSON_URL} did not return valid JSON: ${err.message}`)
	}

	let ids = (geojson.features ?? []).map((feature) => feature.id).filter(Boolean)
	return new Set(ids)
}

class UnreachableError extends Error {}

function readBuildingHoursFiles() {
	return fs
		.readdirSync(BUILDING_HOURS_DIR)
		.filter(isNotJunk)
		.map((filename) => {
			let filepath = path.join(BUILDING_HOURS_DIR, filename)
			let data = loadYaml(fs.readFileSync(filepath, 'utf-8'), {filename: filepath})
			return {filename, name: data.name, building: data.building}
		})
		.filter((entry) => entry.building)
}

// Levenshtein distance, so a typo'd key ("stavhal") points the report at the
// id it was probably meant to be ("stavhall") instead of leaving someone to
// scan 128 ids by eye.
function levenshtein(a, b) {
	let rows = a.length + 1
	let cols = b.length + 1
	let dist = Array.from({length: rows}, (_, i) => [i, ...Array(cols - 1).fill(0)])
	for (let j = 0; j < cols; j++) {
		dist[0][j] = j
	}

	for (let i = 1; i < rows; i++) {
		for (let j = 1; j < cols; j++) {
			let cost = a[i - 1] === b[j - 1] ? 0 : 1
			dist[i][j] = Math.min(dist[i - 1][j] + 1, dist[i][j - 1] + 1, dist[i - 1][j - 1] + cost)
		}
	}

	return dist[rows - 1][cols - 1]
}

function closestIds(id, allIds, count = 3) {
	return [...allIds].sort((a, b) => levenshtein(id, a) - levenshtein(id, b)).slice(0, count)
}

async function main() {
	let featureIds
	try {
		featureIds = await fetchFeatureIds()
	} catch (err) {
		if (err instanceof UnreachableError) {
			console.error(`Could not verify building keys: ${err.message}`)
			process.exit(EXIT_UNREACHABLE)
		}
		throw err
	}

	let entries = readBuildingHoursFiles()
	let failures = entries.filter((entry) => !featureIds.has(entry.building))

	for (let entry of failures) {
		let suggestions = closestIds(entry.building, featureIds).join(', ')
		console.log(
			`${entry.filename}: building "${entry.building}" (${entry.name}) is not a known feature id`,
		)
		console.log(`  closest ids: ${suggestions}`)
	}

	if (failures.length > 0) {
		console.log(`${failures.length} of ${entries.length} building keys failed to resolve`)
		process.exit(EXIT_INVALID_KEY)
	}

	console.log(`${entries.length} building keys all resolve`)
	process.exit(EXIT_OK)
}

main()
