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

/** Downloads and unzips the feed, returning the directory it landed in. */
async function downloadFeed() {
	let dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtfs-'))
	let zipPath = path.join(dir, 'feed.zip')

	let response = await fetch(FEED_URL)
	if (!response.ok) {
		throw new Error(`${FEED_URL} responded ${response.status}`)
	}
	fs.writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()))

	// Node ships no archive reader, and this runs only in CI and on our own
	// machines -- not worth an npm dependency to decode one 137 KB zip.
	execFileSync('unzip', ['-o', '-q', zipPath, '-d', path.join(dir, 'feed')])

	return path.join(dir, 'feed')
}

function readYaml(filename) {
	return load(fs.readFileSync(path.join(BUS_TIMES, filename), 'utf-8'))
}

async function main() {
	let args = process.argv.slice(2)
	let feedFlag = args.indexOf('--feed')
	let feedDir = feedFlag === -1 ? await downloadFeed() : args[feedFlag + 1]

	let feed = readFeed(feedDir)

	// readFeed returns [] for a missing file the same way it does for a
	// genuinely optional one, so a wrong --feed path or an empty unzip looks
	// just like a feed with no calendar_dates.txt. Catch it here rather than
	// let the transform write three timetables with no schedules.
	if (feed.routes.length === 0 || feed.trips.length === 0 || feed.stopTimes.length === 0) {
		console.error(`error: no GTFS data found in ${feedDir}`)
		process.exit(1)
	}

	let feedEnd = feed.feedInfo[0]?.feed_end_date

	let {files, warnings} = gtfsToBusTimes(feed, {
		curation: readYaml('_curation.yaml'),
		repairs: readYaml('_repairs.yaml'),
	})

	for (let warning of warnings) {
		console.warn(`warning: ${warning}`)
	}

	for (let [filename, line] of files) {
		let target = path.join(BUS_TIMES, filename)
		fs.writeFileSync(target, dump(line, {lineWidth: -1, quotingType: "'"}))
		console.log(`wrote ${target}`)
	}

	// An expired feed keeps the last generated YAML on the site forever while
	// the refresh job quietly finds nothing to change. Fail instead.
	if (feedEnd && feedEnd < new Date().toISOString().slice(0, 10).replaceAll('-', '')) {
		console.error(`error: the feed expired on ${feedEnd}; it is no longer being published`)
		process.exit(1)
	}
}

if (import.meta.main) {
	await main()
}
