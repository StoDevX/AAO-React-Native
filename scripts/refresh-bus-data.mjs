#!/usr/bin/env node
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {dump, load} from 'js-yaml'
import {readFeed} from './gtfs.mjs'
import {gtfsToBusTimes} from './gtfs-to-bus-times.mjs'
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
 * Today's date as GTFS's YYYYMMDD, read in the feed's own calendar.
 *
 * `feed_end_date` is the operator's local date, not UTC, so comparing it
 * against `new Date().toISOString()` can flip a day early or late near UTC
 * midnight. Every stop this feed publishes is America/Chicago.
 */
function todayInChicago() {
	return new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Chicago'})
		.format(new Date())
		.replaceAll('-', '')
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
		} else if (feedEnd < todayInChicago()) {
			throw new Error(`the feed expired on ${feedEnd}; it is no longer being published`)
		}

		let {files, warnings} = gtfsToBusTimes(feed, {
			curation: readYaml('_curation.yaml'),
			repairs: readYaml('_repairs.yaml'),
		})

		for (let warning of warnings) {
			console.warn(`warning: ${warning}`)
		}

		for (let [filename, line] of files) {
			let target = path.join(BUS_TIMES, filename)
			fs.writeFileSync(target, dump(line, {lineWidth: -1, quotingType: "'", flowLevel: 4}))
			console.log(`wrote ${target}`)
		}
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
