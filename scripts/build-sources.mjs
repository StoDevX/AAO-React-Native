#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {load} from 'js-yaml'

/// The app ships a copy of the manifest as its offline fallback. Nothing else
/// in `data/` is embedded in the binary, so this is generated here rather than
/// copied by hand — `mise run bundle-data` keeps the two in step.
const BUNDLED_COPY = path.join(import.meta.dirname, '..', 'modules/data-sources/bundled.json')

// The manifest is a JRD document (RFC 7033 §4.4), which must be the root
// object. convertDataFile would wrap it in {data: …}, so it gets a builder.
// `bundledCopy` names where the app's copy goes; without one, none is written.
/** The manifest as published, and as the app's copy holds it. */
export function renderSources(sourceFile) {
	return JSON.stringify(load(fs.readFileSync(sourceFile, 'utf-8'))) + '\n'
}

export function buildSources({sourceFile, outputFile, bundledCopy}) {
	let serialized = renderSources(sourceFile)

	fs.mkdirSync(path.dirname(outputFile), {recursive: true})
	fs.writeFileSync(outputFile, serialized)

	if (bundledCopy) {
		fs.mkdirSync(path.dirname(bundledCopy), {recursive: true})
		fs.writeFileSync(bundledCopy, serialized)
	}
}

if (import.meta.main) {
	let [, , sourceFile, outputFile] = process.argv
	if (!sourceFile || !outputFile) {
		console.error('usage: node build-sources.mjs <source> <output>')
		process.exit(1)
	}

	buildSources({sourceFile, outputFile, bundledCopy: BUNDLED_COPY})
}
