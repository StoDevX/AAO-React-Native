import {parse} from 'csv-parse/sync'
import fs from 'node:fs'
import path from 'node:path'

/** Parses CSV text into row objects keyed by the header row. */
export function parseCsv(text) {
	if (text.trim().length === 0) {
		return []
	}

	let header = []
	let rows = parse(text, {
		// Captures the header names as csv-parse sees them, so a short row
		// (fewer fields than the header) can still be filled out below.
		columns: (headerRow) => {
			header = headerRow
			return headerRow
		},
		bom: true,
		skip_empty_lines: true,
		relax_column_count: true,
	})

	// csv-parse omits a key entirely for a field a short row didn't reach.
	// Filling it with '' keeps `row.stop_lat === ''` distinguishable from a
	// parsed `0`, which is what downstream coordinate validation checks for.
	return rows.map((row) => Object.fromEntries(header.map((name) => [name, row[name] ?? ''])))
}

/** The files we read. `calendar_dates` is optional in GTFS. */
const FEED_FILES = {
	feedInfo: 'feed_info.txt',
	agency: 'agency.txt',
	routes: 'routes.txt',
	trips: 'trips.txt',
	stopTimes: 'stop_times.txt',
	stops: 'stops.txt',
	shapes: 'shapes.txt',
	calendar: 'calendar.txt',
	calendarDates: 'calendar_dates.txt',
}

/** Reads an unzipped GTFS feed directory into arrays of row objects. */
export function readFeed(dir) {
	return Object.fromEntries(
		Object.entries(FEED_FILES).map(([key, filename]) => {
			let filepath = path.join(dir, filename)
			if (!fs.existsSync(filepath)) {
				return [key, []]
			}
			return [key, parseCsv(fs.readFileSync(filepath, 'utf-8'))]
		}),
	)
}
