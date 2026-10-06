#!/usr/bin/env node

// Finds the Student Work postings that belong to no area tile, and explains
// each from the unit number in its description.
//
// A posting is in an area when the unit ccc-server publishes for it is one the
// area lists. This sorts the board the same way, with the app's own URLs from
// modules/ccc-jobs, and reports what lands in no area.
//
// Prints a Markdown report. With --check, exits 1 when some posting carries a
// unit that no area lists; postings with no usable unit number are reported
// but never fail the run, because no edit to the areas file can place them.
// Any other failure exits 2, so a flaky fetch is not mistaken for drift.

import {readFileSync} from 'node:fs'
import {load} from 'js-yaml'
import {parseRequisitions} from '../modules/ccc-jobs/parsers/requisitions.ts'
import {detailUrl, jobPageUrl, parseSiteHref, requisitionsUrl} from '../modules/ccc-jobs/urls.ts'
import {
	classifyUnassigned,
	formatReport,
	parseUnitNames,
	postingsOutsideAreas,
	unitFieldOf,
} from './student-work-units.mjs'

const AREAS = new URL('../data/student-work-areas.yaml', import.meta.url)
const SOURCES = new URL('../data/sources.yaml', import.meta.url)
const REL_JOBS = 'https://frogpond.tech/rel/jobs'
const REL_UNITS = 'https://frogpond.tech/rel/student-work-units'
/** What the app resolves a relative source against; see source/lib/constants.ts. */
const API_ROOT = 'https://stolaf.api.frogpond.tech/v1/'
const UNIT_NAMES_URL =
	'https://www.stolaf.edu/apps/workauth/Autocomplete.cfc?method=setLawsonUnitsAccountNumber&returnformat=json'

let check = process.argv.includes('--check')

async function fetchJson(url) {
	let response = await fetch(url)
	if (!response.ok) {
		throw new Error(`student-work: ${url} responded with ${response.status}`)
	}
	return response.json()
}

async function main() {
	// The board's address is whatever the app is told to use; reading it from the
	// bundled manifest keeps the two from drifting apart.
	let {links} = load(readFileSync(SOURCES, 'utf8'))
	let jobs = links.find((entry) => entry.rel === REL_JOBS)
	if (!jobs) throw new Error(`student-work: no ${REL_JOBS} link in data/sources.yaml`)
	let site = parseSiteHref(jobs.href)
	let units = links.find((entry) => entry.rel === REL_UNITS)
	if (!units) throw new Error(`student-work: no ${REL_UNITS} link in data/sources.yaml`)

	let areas = load(readFileSync(AREAS, 'utf8'))
	// ccc-server publishes "unknown" for a posting with no readable unit number.
	// The Unknown area holds those, but no edit places them, so they stay in the report.
	let listedUnits = new Set(areas.flatMap((area) => area.units))
	listedUnits.delete('unknown')

	let [board, published] = await Promise.all([
		fetchJson(requisitionsUrl(site)).then(parseRequisitions),
		fetchJson(new URL(units.href, API_ROOT)),
	])

	let outside = postingsOutsideAreas(board, published, listedUnits)

	let [postings, names] = await Promise.all([
		Promise.all(
			outside.map(async (job) => {
				let {items} = await fetchJson(detailUrl(site, job.id))
				return {
					id: job.id,
					title: job.title,
					url: jobPageUrl(jobs.href, job.id),
					unitField: unitFieldOf(items?.[0]?.ExternalDescriptionStr),
				}
			}),
		),
		fetchJson(UNIT_NAMES_URL).then(parseUnitNames),
	])

	let result = classifyUnassigned(postings, listedUnits, published)
	let unassigned =
		[...result.unlisted.values()].flat().length + result.missed.length + result.unreadable.length

	console.log(
		`${board.length} postings on the board; ${board.length - unassigned} are in an area.\n`,
	)
	console.log(formatReport(result, names))

	return result
}

try {
	let result = await main()
	process.exit(check && result.unlisted.size > 0 ? 1 : 0)
} catch (error) {
	console.error(error)
	process.exit(2)
}
