#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

export function buildFaqs({sourceFile, outputFile}) {
	let raw = yaml.load(fs.readFileSync(sourceFile, 'utf-8')) ?? {}
	let faqs = Array.isArray(raw.faqs) ? raw.faqs : []
	let legacyText =
		typeof raw.legacyText === 'string'
			? raw.legacyText
			: typeof raw.text === 'string'
			  ? raw.text
			  : ''

	let payload = {
		faqs,
		text: legacyText,
	}

	fs.mkdirSync(path.dirname(outputFile), {recursive: true})
	fs.writeFileSync(outputFile, JSON.stringify(payload) + '\n')
}

const isMain =
	process.argv[1] &&
	path.resolve(process.argv[1]) === new URL(import.meta.url).pathname

if (isMain) {
	let [, , sourceFile, outputFile] = process.argv
	if (!sourceFile || !outputFile) {
		console.error('usage: node build-faqs.mjs <source> <output>')
		process.exit(1)
	}

	buildFaqs({sourceFile, outputFile})
}
