#!/usr/bin/env node

// Brings data/ksto-schedule.yaml into line with KSTO's Now Playing post. It
// writes the whole file or nothing: a post whose schedule changed shape throws
// in parseSchedule before anything is written, so a changed post can never
// empty the schedule. A file dated after the post is left alone: it was written
// by hand from a schedule the post has not caught up with.

import {readFileSync, writeFileSync} from 'node:fs'
import {load} from 'js-yaml'
import {
	diffSchedule,
	fileOutdatesPost,
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
let ours = current ? load(current) : undefined
let held = fileOutdatesPost(ours?.updated, updated)
let next = held ? current : renderSchedule({updated, slots})
let {added, removed} = diffSchedule(ours?.shows ?? [], slots)

if (next !== current && !check) {
	writeFileSync(DATA_FILE, next)
}

let report = ['## KSTO schedule', '', `Source: ${SOURCE_PAGE} (updated ${updated})`, '']
if (held) {
	report.push(
		`Left alone — the file is dated ${ours.updated}, after the post, which differs by:`,
		'',
		...added.map((slot) => `- the post has ${slot}`),
		...removed.map((slot) => `- the file has ${slot}`),
	)
} else if (next === current) {
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
