#!/usr/bin/env node

// Brings data/building-hours/ into line with Bon Appétit's published café
// schedules. Two venues are written; the rest are compared and reported.
//
// There is no partial success. A café that fails to fetch or parse aborts the
// whole run, because half a schedule written into a venue file makes the app
// report that venue closed.
//
// Which venue is written, how its meal periods map onto our section titles,
// and why a venue is only watched all live in scripts/bonapp-overrides.yaml.

import {readFileSync, writeFileSync} from 'node:fs'
import {load} from 'js-yaml'
import {
	composeSchedule,
	extractSchedule,
	parseWeeklySchedule,
	spliceSchedule,
} from './bonapp-schedule.mjs'

const CAFE_URL = (slug) => `https://stolaf.cafebonappetit.com/cafe/${slug}/`
const OVERRIDES = new URL('bonapp-overrides.yaml', import.meta.url)

let check = process.argv.includes('--check')
let {venues} = load(readFileSync(OVERRIDES, 'utf8'))

async function fetchCafe(slug) {
	let response = await fetch(CAFE_URL(slug))
	if (!response.ok) {
		throw new Error(`bonapp: ${CAFE_URL(slug)} responded with ${response.status}`)
	}
	return response.text()
}

// Every café is fetched and parsed before anything is written. Writing inside
// the fetch loop meant a café that failed on the third pass left the first two
// already written -- the half-written state this is supposed to prevent.
let scraped = await Promise.all(
	Object.entries(venues).map(async ([slug, venue]) => ({
		slug,
		venue,
		rows: parseWeeklySchedule(await fetchCafe(slug)),
	})),
)

let changed = []
let drifted = []

for (let {slug, venue, rows} of scraped) {
	if (venue.watch_only) {
		// A watched venue with no file of ours -- the King's Room -- has nothing
		// to compare against, so the report is just what the café publishes.
		if (!venue.file) {
			drifted.push({slug, theirs: describe(rows), reason: venue.watch_only})
			continue
		}
		let ours = extractSchedule(readFileSync(venue.file, 'utf8'))
		let theirs = composeSchedule(rows, venue)
		if (ours !== theirs) {
			drifted.push({slug, file: venue.file, ours, theirs, reason: venue.watch_only})
		}
		continue
	}

	let text = readFileSync(venue.file, 'utf8')
	let next = spliceSchedule(text, composeSchedule(rows, venue))
	if (next !== text) {
		changed.push(venue.file)
		if (!check) {
			writeFileSync(venue.file, next)
		}
	}
}

let report = [
	'## Dining hours',
	'',
	changed.length === 0
		? 'No change — what we ship already matches Bon Appétit.'
		: `${check ? 'Out of date' : 'Updated'}:\n${changed.map((file) => `- \`${file}\``).join('\n')}`,
]

if (drifted.length > 0) {
	report.push('', '### Watched, not written', '')
	for (let entry of drifted) {
		report.push(`**${slugLabel(entry.slug)}** — ${entry.reason.trim()}`, '')
		if (entry.ours) {
			report.push('We ship:', '', '```yaml', entry.ours.trimEnd(), '```', '')
		}
		let fence = entry.file ? '```yaml' : '```'
		report.push('Bon Appétit publishes:', '', fence, entry.theirs.trimEnd(), '```', '')
	}
}

function slugLabel(slug) {
	return slug.replaceAll('-', ' ')
}

/** Rows as prose, for a café we ship no venue for and so cannot diff. */
function describe(rows) {
	return rows
		.map((row) => `${row.daypart}: ${row.days.join(', ')}, ${row.from} to ${row.to}`)
		.join('\n')
}

let summary = report.join('\n')
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) {
	writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, {flag: 'a'})
}

// --check is the pull-request dry run: a non-zero exit means the scrape and
// the data have diverged, which is worth a red tick on a PR that touches this.
process.exit(check && changed.length > 0 ? 1 : 0)
