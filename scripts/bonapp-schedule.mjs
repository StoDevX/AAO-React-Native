// Turns a Bon Appétit café page into the `schedule:` block of a building-hours
// file. Everything here is pure -- no network, no filesystem, no clock, and no
// imports beyond html-text.mjs -- so the whole pipeline is exercised by
// scripts/bonapp-schedule.test.mjs against committed fixtures.
// scripts/scrape-bonapp.mjs does the I/O.

// The page escapes its punctuation: the Cave's "Grab 'n' Go" arrives as
// `Grab &#039;n&#039; Go`, and a daypart name has to match the overrides file
// exactly or composing throws.
import {htmlText} from './html-text.mjs'

/** The week in the order the data files list it. */
export const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const DAY_BY_NAME = {Mon: 'Mo', Tue: 'Tu', Wed: 'We', Thu: 'Th', Fri: 'Fr', Sat: 'Sa', Sun: 'Su'}

/** Matches the data schema's time definition in data/_schemas/_defs.yaml. */
const TIME = /^1?\d:[0-5]?\d[ap]m$/u

// Special hours and weekly hours share row classes. Only the list directly
// under Weekly Schedule defines recurring hours; dated rows elsewhere on the
// page must not become the normal weekly schedule.
const WEEKLY_LIST = /<p\b[^>]*>\s*Weekly Schedule\s*<\/p>\s*<ul\b[^>]*>(.*?)<\/ul>/su
const ROW = /<li class=['"][^'"]*\bday-part\b[^'"]*['"]>(.*?)<\/li>/gsu
const SPAN = /<span class=['"][^'"]*['"]>(.*?)<\/span>/gsu

let normalizeTime = (raw) => raw.replaceAll(/\s+/gu, '').toLowerCase()

function expandDays(spec) {
	let [first, last] = spec.split('-').map((part) => part.trim())
	let start = DAYS.indexOf(DAY_BY_NAME[first])
	if (start < 0) {
		throw new Error(`bonapp: unknown day "${first}" in "${spec}"`)
	}
	if (!last) {
		return [DAYS[start]]
	}
	let end = DAYS.indexOf(DAY_BY_NAME[last])
	if (end < 0) {
		throw new Error(`bonapp: unknown day "${last}" in "${spec}"`)
	}
	return DAYS.slice(start, end + 1)
}

/**
 * Reads a Bon Appétit café page's Weekly Schedule into rows.
 *
 * Throws rather than returning an empty list for anything unexpected: an empty
 * schedule written to a venue file makes the app report it permanently closed,
 * which is worse than a failed run nobody has to act on.
 */
export function parseWeeklySchedule(html) {
	if (!html.includes('Weekly Schedule')) {
		throw new Error('bonapp: no Weekly Schedule section in the page')
	}

	let weekly = WEEKLY_LIST.exec(html)?.[1] ?? ''
	let rows = []
	for (let [, inner] of weekly.matchAll(ROW)) {
		let spans = [...inner.matchAll(SPAN)].map(([, span]) => htmlText(span))
		let [daypart, when] = spans.length >= 2 ? spans : [htmlText(inner), '']
		let match = /^(.+?),\s*(\S+\s*[ap]m)\s*-\s*(\S+\s*[ap]m)$/iu.exec(when)
		if (!match) {
			throw new Error(`bonapp: could not read hours from "${when}"`)
		}

		let [, dayspec, from, to] = match
		let row = {
			daypart,
			days: expandDays(dayspec),
			from: normalizeTime(from),
			to: normalizeTime(to),
		}
		for (let key of ['from', 'to']) {
			if (!TIME.test(row[key])) {
				throw new Error(`bonapp: "${row[key]}" is not a time the data schema accepts`)
			}
		}
		rows.push(row)
	}

	if (rows.length === 0) {
		throw new Error('bonapp: no day-part rows in the Weekly Schedule')
	}
	return rows
}

let minutes = (time) => {
	let [, hours, mins, half] = /^(\d+):(\d+)([ap])m$/u.exec(time)
	return ((Number(hours) % 12) + (half === 'p' ? 12 : 0)) * 60 + Number(mins)
}

/**
 * Renders rows as the `schedule:` block of a building-hours file, including the
 * blank line that separates it from any following field.
 *
 * Section order follows `venue.dayparts` rather than the page, because the page
 * leads the Cage with its Sunday breakfast while our file leads with its hours.
 * Row order is by first day then start time, which is what every file in
 * data/building-hours already does -- sorting by time first would put Stav's
 * Sunday brunch above its Saturday one.
 */
export function composeSchedule(rows, venue) {
	let dayparts = venue.dayparts ?? {}
	let skip = new Set(venue.skip)
	let notes = venue.notes ?? {}

	let sections = new Map()
	for (let title of Object.values(dayparts)) {
		if (!sections.has(title)) {
			sections.set(title, [])
		}
	}

	for (let row of rows) {
		if (skip.has(row.daypart)) {
			continue
		}
		let title = dayparts[row.daypart]
		if (!title) {
			throw new Error(
				`bonapp: daypart "${row.daypart}" is neither mapped nor skipped; ` +
					'add it to dayparts or skip in scripts/bonapp-overrides.yaml',
			)
		}
		sections.get(title).push(row)
	}

	let out = 'schedule:\n'
	for (let [title, entries] of sections) {
		entries.sort(
			(a, b) =>
				DAYS.indexOf(a.days[0]) - DAYS.indexOf(b.days[0]) || minutes(a.from) - minutes(b.from),
		)
		out += `  - title: ${title}\n`
		if (notes[title]) {
			out += `    notes: ${notes[title]}\n`
		}
		out += '    hours:\n'
		for (let row of entries) {
			out += `      - {days: [${row.days.join(', ')}], from: '${row.from}', to: '${row.to}'}\n`
		}
		out += '\n'
	}
	return out
}

/** Finds the schedule's byte range, preserving comments before the next field. */
function anchors(fileText) {
	let header = /^schedule:[\t ]*(?:\n|$)/mu.exec(fileText)
	if (!header) {
		throw new Error('bonapp: the file has no `schedule:` line')
	}
	let start = header.index
	let bodyStart = start + header[0].length
	let lines = [...fileText.slice(bodyStart).matchAll(/[^\n]+\n?|\n/gu)]
	let nextField = lines.findIndex((line) => /^[^\s#][^:\n]*:/u.test(line[0]))
	let boundary = nextField < 0 ? lines.length : nextField
	let end = nextField < 0 ? fileText.length : bodyStart + lines[nextField].index

	// Trailing top-level comments belong to the following field or to the file
	// at EOF. Blank lines before those comments stay with the schedule.
	for (let i = boundary - 1; i >= 0; i--) {
		let [line] = lines[i]
		if (line.startsWith('#')) {
			end = bodyStart + lines[i].index
		} else if (line.trim() !== '') {
			break
		}
	}
	return [start, end]
}

/**
 * Replaces a file's `schedule:` block, preserving existing fields and comments.
 * Adds an empty `breakSchedule` mapping when the file has no break overrides.
 *
 * Text splicing rather than a YAML round-trip: js-yaml's dumper emits block
 * style, which would rewrite every `{days: ...}` line in both owned files into
 * a multi-line spurious diff the first time this ran, and would drop the
 * comments any of these files might later carry.
 */
export function spliceSchedule(fileText, block) {
	let [start, end] = anchors(fileText)
	let next = fileText.slice(0, start) + block + fileText.slice(end)
	if (!/^breakSchedule:/mu.test(fileText)) {
		if (!next.endsWith('\n')) {
			next += '\n'
		}
		next += 'breakSchedule: {}\n'
	}
	return next
}

/**
 * A file's current `schedule:` block, verbatim, for comparing against a venue
 * we do not write. Textual rather than parsed: every hour row in
 * data/building-hours quotes its times the same way, so the only differences a
 * text comparison can report are real ones.
 */
export function extractSchedule(fileText) {
	let [start, end] = anchors(fileText)
	return fileText.slice(start, end)
}
