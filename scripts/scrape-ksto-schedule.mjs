#!/usr/bin/env node

// Brings data/ksto-schedule.yaml into line with KSTO's Now Playing post. It
// writes the whole file or nothing: a post whose schedule changed shape throws
// in parseSchedule before anything is written, so a changed post can never
// empty the schedule.

import {readFileSync, writeFileSync} from 'node:fs'
import {load} from 'js-yaml'
import {
	diffSchedule,
	parseSchedule,
	postContent,
	renderSchedule,
	SOURCE_API,
	SOURCE_PAGE,
} from './ksto-schedule.mjs'

const DATA_FILE = new URL('../data/ksto-schedule.yaml', import.meta.url)

let check = process.argv.includes('--check')

let response = await fetch(SOURCE_API)
if (!response.ok) {
	throw new Error(`ksto-schedule: ${SOURCE_API} responded with ${response.status}`)
}
let {script, updated} = postContent(await response.json())
let slots = parseSchedule(script)

let current = ''
try {
	current = readFileSync(DATA_FILE, 'utf8')
} catch (error) {
	if (error.code !== 'ENOENT') throw error
}
let next = renderSchedule({updated, slots})
let {added, removed} = diffSchedule(current ? load(current)?.shows : [], slots)

if (next !== current && !check) {
	writeFileSync(DATA_FILE, next)
}

let report = ['## KSTO schedule', '', `Source: ${SOURCE_PAGE} (updated ${updated})`, '']
if (next === current) {
	report.push('No change — what we publish already matches the post.')
} else if (added.length === 0 && removed.length === 0) {
	report.push('The shows match; the post was edited, or the file is laid out differently.')
} else {
	report.push(
		check ? 'Out of date:' : 'Updated:',
		'',
		...added.map((slot) => `- added ${slot}`),
		...removed.map((slot) => `- removed ${slot}`),
	)
}

let summary = report.join('\n')
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) {
	writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, {flag: 'a'})
}

// --check is the pull-request dry run: a non-zero exit means the post and the
// data have diverged.
process.exit(check && next !== current ? 1 : 0)
