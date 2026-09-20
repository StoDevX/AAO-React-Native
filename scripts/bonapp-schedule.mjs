// Turns a Bon Appétit café page into the `schedule:` block of a building-hours
// file. Everything here is pure -- no network, no filesystem, no clock, no
// imports -- so the whole pipeline is exercised by scripts/bonapp-schedule.test.mjs
// against committed fixtures. scripts/scrape-bonapp.mjs does the I/O.

/** The week in the order the data files list it. */
export const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const DAY_BY_NAME = {Mon: 'Mo', Tue: 'Tu', Wed: 'We', Thu: 'Th', Fri: 'Fr', Sat: 'Sa', Sun: 'Su'}

/** Matches the data schema's time definition in data/_schemas/_defs.yaml. */
const TIME = /^1?\d:[0-5]?\d[ap]m$/u

// The weekly list and the "open now" list above it share
// `dotted-leader-container`; only the weekly one is a `day-part`. Keying on
// that class is what keeps today's single-line hours out of the result -- they
// name no day, so taking them would invent hours for the whole week.
const ROW = /<li class=['"][^'"]*\bday-part\b[^'"]*['"]>(.*?)<\/li>/gsu
const SPAN = /<span class=['"][^'"]*['"]>(.*?)<\/span>/gsu

// The page escapes its punctuation: the Cave's "Grab 'n' Go" arrives as
// `Grab &#039;n&#039; Go`, and a daypart name has to match the overrides file
// exactly or composing throws.
const NAMED = {nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"}

let decode = (html) =>
	html.replaceAll(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (entity, body) => {
		if (body.startsWith('#x') || body.startsWith('#X')) {
			return String.fromCodePoint(Number.parseInt(body.slice(2), 16))
		}
		if (body.startsWith('#')) {
			return String.fromCodePoint(Number(body.slice(1)))
		}
		return NAMED[body.toLowerCase()] ?? entity
	})

let text = (html) =>
	decode(html.replaceAll(/<[^>]+>/gu, ' '))
		.replaceAll(/\s+/gu, ' ')
		.trim()

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

	let rows = []
	for (let [, inner] of html.matchAll(ROW)) {
		let spans = [...inner.matchAll(SPAN)].map(([, span]) => text(span))
		let [daypart, when] = spans.length >= 2 ? spans : [text(inner), '']
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
