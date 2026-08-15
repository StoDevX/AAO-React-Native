#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {load} from 'js-yaml'

/// The app ships a copy of the manifest as its offline fallback. Nothing else
/// in `data/` is embedded in the binary, so this is generated here rather than
/// copied by hand — `mise run bundle-data` keeps the two in step.
const BUNDLED_COPY = 'modules/data-sources/bundled.json'

// The manifest is a JRD document (RFC 7033 §4.4), which must be the root
// object. convertDataFile would wrap it in {data: …}, so it gets a builder.
export function buildSources({sourceFile, outputFile}) {
	let manifest = load(fs.readFileSync(sourceFile, 'utf-8'))
	let serialized = JSON.stringify(manifest) + '\n'

	fs.mkdirSync(path.dirname(outputFile), {recursive: true})
	fs.writeFileSync(outputFile, serialized)

	fs.mkdirSync(path.dirname(BUNDLED_COPY), {recursive: true})
	fs.writeFileSync(BUNDLED_COPY, serialized)
}

const isMain =
	process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname

if (isMain) {
	let [, , sourceFile, outputFile] = process.argv
	if (!sourceFile || !outputFile) {
		console.error('usage: node build-sources.mjs <source> <output>')
		process.exit(1)
	}

	buildSources({sourceFile, outputFile})
}
