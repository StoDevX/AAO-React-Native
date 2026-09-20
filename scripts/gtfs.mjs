import fs from 'node:fs'
import path from 'node:path'

/**
 * Splits one CSV line into fields, honouring RFC 4180 quoting.
 *
 * `stops.txt` quotes any name holding a comma -- "Plainview, MN, USA" -- and
 * escapes a literal quote by doubling it.
 */
function splitLine(line) {
	let fields = []
	let field = ''
	let inQuotes = false

	for (let i = 0; i < line.length; i += 1) {
		let char = line[i]

		if (inQuotes) {
			if (char === '"' && line[i + 1] === '"') {
				field += '"'
				i += 1
			} else if (char === '"') {
				inQuotes = false
			} else {
				field += char
			}
		} else if (char === '"') {
			inQuotes = true
		} else if (char === ',') {
			fields.push(field)
			field = ''
		} else {
			field += char
		}
	}

	fields.push(field)
	return fields
}

/** Parses CSV text into row objects keyed by the header row. */
export function parseCsv(text) {
	// A BOM would otherwise ride along on the first header name, making
	// `row.stop_id` undefined for every row in the file.
	let body = text.replace(/^﻿/u, '')
	let lines = body.split(/\r?\n/u).filter((line) => line.length > 0)

	if (lines.length === 0) {
		return []
	}

	let header = splitLine(lines[0])

	return lines.slice(1).map((line) => {
		let fields = splitLine(line)
		return Object.fromEntries(header.map((name, i) => [name, fields[i] ?? '']))
	})
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
