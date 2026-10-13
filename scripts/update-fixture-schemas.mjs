#!/usr/bin/env node

// Writes source/features/campus/__schemas__/<schema>.json for each endpoint in
// fixture-endpoints.ts, inferred from every St. Olaf and Carleton recording
// that matches it, from the endpoint's `live` samples (fetched here), and from
// its hand-written `samples`. Rerun it after `mise run update-campus-fixtures`;
// the schema test then names any Wiki Monkeys fixture whose shape has drifted.

import {mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {endpointFor, FIXTURE_ENDPOINTS} from '../source/features/campus/fixture-endpoints.ts'
import {inferSchema} from './infer-schema.mjs'

const FIXTURES = fileURLToPath(new URL('../source/features/campus/__fixtures__/', import.meta.url))
const SCHEMAS = fileURLToPath(new URL('../source/features/campus/__schemas__/', import.meta.url))
const RECORDED = ['edu.stolaf', 'edu.carleton']

let samples = new Map(FIXTURE_ENDPOINTS.map((endpoint) => [endpoint.schema, []]))
for (let campus of RECORDED) {
	for (let name of readdirSync(join(FIXTURES, campus)).filter((n) => n.endsWith('.json'))) {
		let {key, json} = JSON.parse(readFileSync(join(FIXTURES, campus, name), 'utf8'))
		let endpoint = endpointFor(key)
		if (endpoint && json !== undefined) samples.get(endpoint.schema).push(json)
	}
}
/** A live sample's JSON, refusing an error answer. */
async function fetchSample(url) {
	let response = await fetch(url)
	if (!response.ok) throw new Error(`${url} answered ${response.status}`)
	return response.json()
}

let live = FIXTURE_ENDPOINTS.flatMap((endpoint) =>
	(endpoint.live ?? []).map(async (url) => [endpoint.schema, await fetchSample(url)]),
)
for (let [schema, json] of await Promise.all(live)) {
	samples.get(schema).push(json)
}
for (let endpoint of FIXTURE_ENDPOINTS) {
	samples.get(endpoint.schema).push(...(endpoint.samples ?? []))
}

mkdirSync(SCHEMAS, {recursive: true})
for (let [schema, values] of samples) {
	if (values.length === 0) {
		console.warn(`no samples for ${schema}; give its endpoint a live URL`)
		continue
	}
	let body = {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		$comment: `Written by mise run update-fixture-schemas from ${values.length} samples; regenerate rather than edit.`,
		...inferSchema(values),
	}
	writeFileSync(join(SCHEMAS, `${schema}.json`), `${JSON.stringify(body, null, '\t')}\n`)
	console.log(`${schema}: ${values.length} samples`)
}
