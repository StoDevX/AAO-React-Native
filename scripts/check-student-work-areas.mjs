#!/usr/bin/env node

// Finds the Student Work postings that belong to no area tile, and explains
// each from the unit number in its description.
//
// A posting is in an area when a keyword search for one of the area's units
// finds it, so this runs the app's own searches -- the same URLs and parsers,
// imported from modules/ccc-jobs -- and takes what none of them found. Reading
// unit numbers first and comparing them with the areas file would miss the
// postings whose unit is listed but mistyped, which no tile shows either.
//
// Prints a Markdown report. With --check, exits 1 when some posting carries a
// unit that no area lists; postings with no usable unit number are reported
// but never fail the run, because no edit to the areas file can place them.
// Any other failure exits 2, so a flaky fetch is not mistaken for drift.

import {readFileSync} from 'node:fs'
import {load} from 'js-yaml'
import {parseRequisitionIds, parseRequisitions} from '../modules/ccc-jobs/parsers/requisitions.ts'
import {
	detailUrl,
	jobPageUrl,
	parseSiteHref,
	requisitionsUrl,
	unitPostingsUrl,
} from '../modules/ccc-jobs/urls.ts'
import {
	classifyUnassigned,
	formatReport,
	parseUnitNames,
	unitFieldOf,
} from './student-work-units.mjs'

const AREAS = new URL('../data/student-work-areas.yaml', import.meta.url)
const SOURCES = new URL('../data/sources.yaml', import.meta.url)
const REL_JOBS = 'https://frogpond.tech/rel/jobs'
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

	let areas = load(readFileSync(AREAS, 'utf8'))
	let listedUnits = new Set(areas.flatMap((area) => area.units))

	let [board, searches] = await Promise.all([
		fetchJson(requisitionsUrl(site)).then(parseRequisitions),
		Promise.all(
			Array.from(listedUnits, async (unit) =>
				parseRequisitionIds(await fetchJson(unitPostingsUrl(site, unit))),
			),
		),
	])

	let found = new Set(searches.flat())
	let unassigned = board.filter((job) => !found.has(job.id))

	let [postings, names] = await Promise.all([
		Promise.all(
			unassigned.map(async (job) => {
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

	let result = classifyUnassigned(postings, listedUnits)

	console.log(
		`${board.length} postings on the board; ${board.length - unassigned.length} are in an area.\n`,
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
