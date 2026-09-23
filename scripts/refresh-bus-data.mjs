#!/usr/bin/env node
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {dump, load} from 'js-yaml'
import {findDuplicateLines, todayInChicago} from './bus-data-checks.mjs'
import {readFeed} from './gtfs.mjs'
import {gtfsToBusTimes, returningRoutes} from './gtfs-to-bus-times.mjs'
import {DATA_BASE} from './paths.mjs'

const FEED_URL = 'https://data.trilliumtransit.com/gtfs/threerivers-mn-us/threerivers-mn-us.zip'
const BUS_TIMES = path.join(DATA_BASE, 'bus-times')

/**
 * Downloads and unzips the feed.
 *
 * Returns the directory the feed landed in, plus the temp root above it so
 * the caller can remove the whole download -- zip included -- once done.
 */
async function downloadFeed() {
	let tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtfs-'))

	try {
		let zipPath = path.join(tempDir, 'feed.zip')

		let response = await fetch(FEED_URL)
		if (!response.ok) {
			throw new Error(`${FEED_URL} responded ${response.status}`)
		}
		fs.writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()))

		// Node ships no archive reader, and this runs only in CI and on our own
		// machines -- not worth an npm dependency to decode one 137 KB zip.
		execFileSync('unzip', ['-o', '-q', zipPath, '-d', path.join(tempDir, 'feed')])

		return {feedDir: path.join(tempDir, 'feed'), tempDir}
	} catch (error) {
		// A failed fetch or a corrupt archive throws before this function
		// returns, so the caller never learns tempDir exists and cannot clean
		// it up itself -- remove it here instead of leaking it.
		fs.rmSync(tempDir, {recursive: true, force: true})
		throw error
	}
}

function readYaml(filename) {
	return load(fs.readFileSync(path.join(BUS_TIMES, filename), 'utf-8'))
}

/**
 * Fails if two data files in `data/bus-times/` publish the same `line:`.
 *
 * Reading the directory back after writing, rather than checking `files`
 * from `gtfsToBusTimes`, is what catches a stray file left over from a
 * rename regardless of how it got there.
 */
function assertNoDuplicateLines() {
	let filenames = fs
		.readdirSync(BUS_TIMES)
		.filter((filename) => filename.endsWith('.yaml') && !filename.startsWith('_'))

	let entries = filenames.map((file) => ({file, line: readYaml(file).line}))

	for (let {line, files} of findDuplicateLines(entries)) {
		throw new Error(
			`${files.join(', ')} all publish the line "${line}"; bundleDataDir would publish it ${files.length} times`,
		)
	}
}

async function main() {
	let args = process.argv.slice(2)
	let feedFlag = args.indexOf('--feed')

	let feedDir
	let tempDir
	if (feedFlag === -1) {
		;({feedDir, tempDir} = await downloadFeed())
	} else {
		feedDir = args[feedFlag + 1]
	}

	try {
		let feed = readFeed(feedDir)

		// readFeed returns [] for a missing file the same way it does for a
		// genuinely optional one, so a wrong --feed path or an empty unzip looks
		// just like a feed with no calendar_dates.txt. Catch it here rather than
		// let the transform write three timetables with no schedules.
		if (feed.routes.length === 0 || feed.trips.length === 0 || feed.stopTimes.length === 0) {
			throw new Error(`no GTFS data found in ${feedDir}`)
		}

		let feedEnd = feed.feedInfo[0]?.feed_end_date

		// An expired feed keeps the last generated YAML on the site forever while
		// the refresh job quietly finds nothing to change. Fail before writing
		// anything, rather than leave a partial refresh in the working tree.
		if (!feedEnd) {
			console.warn('warning: the feed has no feed_end_date; the expiry check cannot run')
		} else if (feedEnd < todayInChicago(new Date())) {
			throw new Error(`the feed expired on ${feedEnd}; it is no longer being published`)
		}

		let curation = readYaml('_curation.yaml')
		let {files, warnings} = gtfsToBusTimes(feed, {
			curation,
			repairs: readYaml('_repairs.yaml'),
		})

		for (let warning of warnings) {
			console.warn(`warning: ${warning}`)
		}

		// Every warning above also reaches stdout, but stdout is a run log
		// nobody reading the PR opens. BUS_DATA_WARNINGS_FILE, when set, is a
		// second channel the workflow reads to put warnings in front of the
		// PR reviewer instead -- unset locally, so this is a no-op outside CI.
		let warningsFile = process.env.BUS_DATA_WARNINGS_FILE
		if (warningsFile) {
			fs.writeFileSync(warningsFile, warnings.map((warning) => `${warning}\n`).join(''))
		}

		// A route kept by hand because the feed's copy was wrong should not stay
		// hand-kept once the feed is right again. BUS_ROUTE_RETURNS_FILE is how
		// the workflow hears about it, in a week with no diff to open a PR for.
		let handKept = new Map(
			Object.values(curation.watched_routes ?? {}).map(({file}) => [file, readYaml(file)]),
		)
		let returning = returningRoutes(feed, curation, handKept, todayInChicago(new Date()))

		for (let {routeId, line, file, matches} of returning) {
			console.warn(
				`notice: ${line} (route ${routeId}) is running in the feed again, and ${matches ? 'matches' : 'differs from'} ${file}`,
			)
		}

		let returnsFile = process.env.BUS_ROUTE_RETURNS_FILE
		if (returnsFile) {
			fs.writeFileSync(returnsFile, JSON.stringify(returning))
		}

		for (let [filename, line] of files) {
			let target = path.join(BUS_TIMES, filename)
			fs.writeFileSync(target, dump(line, {lineWidth: -1, quotingType: "'", flowLevel: 4}))
			console.log(`wrote ${target}`)
		}

		assertNoDuplicateLines()
	} finally {
		if (tempDir) {
			fs.rmSync(tempDir, {recursive: true, force: true})
		}
	}
}

if (import.meta.main) {
	try {
		await main()
	} catch (error) {
		console.error(`error: ${error.message}`)
		process.exit(1)
	}
}
