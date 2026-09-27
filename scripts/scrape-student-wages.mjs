#!/usr/bin/env node

// Brings data/student-wages.yaml into line with St. Olaf's published student
// wage table. It writes the whole file or nothing: a page missing, repeating
// or adding a pay code throws in parseWages before anything is written, so a
// changed page can never empty the table.

import {readFileSync, writeFileSync} from 'node:fs'
import {load} from 'js-yaml'
import {
	diffWages,
	pageContent,
	parseWages,
	renderWages,
	SOURCE_API,
	SOURCE_PAGE,
} from './student-wages.mjs'

const DATA_FILE = new URL('../data/student-wages.yaml', import.meta.url)

let check = process.argv.includes('--check')

let response = await fetch(SOURCE_API)
if (!response.ok) {
	throw new Error(`student-wages: ${SOURCE_API} responded with ${response.status}`)
}
let {html, modified} = pageContent(await response.json())
let theirs = parseWages(html)

let current = readFileSync(DATA_FILE, 'utf8')
let next = renderWages(theirs)
let changes = diffWages(load(current), theirs)

if (next !== current && !check) {
	writeFileSync(DATA_FILE, next)
}

let money = (rate) => (rate === undefined ? 'nothing' : `$${rate.toFixed(2)}`)

let report = ['## Student wages', '', `Source: ${SOURCE_PAGE} (modified ${modified})`, '']
if (next === current) {
	report.push('No change — what we ship already matches the page.')
} else if (changes.length === 0) {
	report.push(
		'Rates match, but `data/student-wages.yaml` is laid out differently from what this script writes.',
	)
} else {
	report.push(check ? 'Out of date:' : 'Updated:', '')
	for (let {code, from, to} of changes) {
		report.push(`- ${code}: ${money(from)} → ${money(to)}`)
	}
}

let summary = report.join('\n')
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) {
	writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, {flag: 'a'})
}

// --check is the pull-request dry run: a non-zero exit means the page and the
// data have diverged.
process.exit(check && next !== current ? 1 : 0)
