// Turns the WordPress REST response for KSTO's "Now Playing" post into
// data/ksto-schedule.yaml. Everything here is pure -- no network, no
// filesystem -- so scripts/ksto-schedule.test.mjs exercises it against a saved
// response. scripts/scrape-ksto-schedule.mjs does the I/O.
//
// The post holds the station's weekly schedule as a script: a list of shows,
// and a table of which show airs in each hour of each weekday. The script is
// parsed, never run -- it is someone else's code, and the scrape runs with a
// token that can push to this repository.

import {parse} from 'acorn'

export const SOURCE_PAGE = 'https://www.kstoradio.org/2023/03/17/4243/'

export const SOURCE_API =
	'https://www.kstoradio.org/wp-json/wp/v2/posts/4243?_fields=modified_gmt,content'

/** The station's clock. The post's own script reads the reader's, which is a bug on the page. */
export const TIMEZONE = 'America/Chicago'

/** The schedule's keys, as the script's `getDay()` numbers them: Sunday is 0. */
export const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/** The order the file lists days in, matching the station's printed schedule. */
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const HOURS = Array.from({length: 24}, (_, hour) => hour)

/** A script element, however its tags are cased or spaced, as browsers read them. */
const SCRIPT = /<script\b[^>]*>(.*?)<\/script\b[^>]*>/gisu

/** A poster the app can draw. Some posters on the post are PDFs, which it cannot. */
const IMAGE = /\.(?:jpe?g|png|gif|webp)(?:\?.*)?$/iu

/** The post's script and its modified time, from the API's response. */
export function postContent(body) {
	let html = body?.content?.rendered
	if (typeof html !== 'string') {
		throw new TypeError('ksto-schedule: the post has no content.rendered')
	}
	let modified = body.modified_gmt
	if (typeof modified !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/u.test(modified)) {
		throw new TypeError(`ksto-schedule: the post has no usable modified_gmt: ${modified}`)
	}

	let scripts = [...html.matchAll(SCRIPT)].map(([, script]) => script)
	let schedule = scripts.filter((script) => script.includes('nowPlaying'))
	if (schedule.length !== 1) {
		throw new Error(
			`ksto-schedule: expected one script defining nowPlaying, found ${schedule.length}`,
		)
	}
	return {script: schedule[0], updated: `${modified}Z`}
}

/** The initial value of each top-level `let`, `const` or `var` in a parsed script. */
function declarations(program) {
	let found = new Map()
	for (let statement of program.body) {
		if (statement.type !== 'VariableDeclaration') continue
		for (let {id, init} of statement.declarations) {
			if (id.type === 'Identifier' && init) found.set(id.name, init)
		}
	}
	return found
}

/** A literal property key, as the text the script would use for it. */
function keyOf(property) {
	if (property.type !== 'Property' || property.computed) {
		throw new Error('ksto-schedule: the schedule has a property that is not a plain key')
	}
	let {key} = property
	if (key.type === 'Identifier') return key.name
	if (key.type === 'Literal') return String(key.value)
	throw new Error(`ksto-schedule: the schedule has a ${key.type} key`)
}

/** A string literal's value, or undefined for anything else. */
const stringOf = (node) =>
	node?.type === 'Literal' && typeof node.value === 'string' ? node.value : undefined

/** The shows the script defines, keyed as its `getShow` looks them up. */
function readShows(node) {
	if (node?.type !== 'ArrayExpression') {
		throw new Error('ksto-schedule: `shows` is not a list')
	}
	let shows = new Map()
	for (let element of node.elements) {
		if (element?.type !== 'ObjectExpression') {
			throw new Error('ksto-schedule: an entry in `shows` is not an object')
		}
		let fields = Object.fromEntries(
			element.properties.map((property) => [keyOf(property), stringOf(property.value)]),
		)
		let name = fields.name?.trim()
		if (!name) {
			throw new Error('ksto-schedule: a show in `shows` has no name')
		}
		// A later definition replaces an earlier one, as the script's Map does.
		shows.set(name.toLowerCase(), {
			title: name,
			genre: fields.genre?.trim() || undefined,
			poster: IMAGE.test(fields.poster ?? '') ? fields.poster.trim() : undefined,
		})
	}
	return shows
}

/** The show an hour's entry names, or null for the off-air placeholder. */
function readSlot(node, shows, where) {
	if (node.type === 'Identifier' && node.name === 'noShow') {
		return null
	}
	let isLookup =
		node.type === 'CallExpression' &&
		node.callee.type === 'MemberExpression' &&
		node.callee.object.type === 'Identifier' &&
		node.callee.object.name === 'showDefs' &&
		node.callee.property.type === 'Identifier' &&
		node.callee.property.name === 'getShow' &&
		node.arguments.length === 1
	let name = isLookup ? stringOf(node.arguments[0]) : undefined
	if (name === undefined) {
		throw new Error(`ksto-schedule: ${where} is neither noShow nor showDefs.getShow("…")`)
	}
	let show = shows.get(name.trim().toLowerCase())
	if (!show) {
		// The page itself breaks on this hour: getShow returns nothing to read a name from.
		throw new Error(`ksto-schedule: ${where} names "${name}", which is not in \`shows\``)
	}
	return show
}

/** The 24 hourly entries of one day, each a show or null. */
function readDay(node, shows, day) {
	if (node?.type !== 'ObjectExpression') {
		throw new Error(`ksto-schedule: ${day} is not an object of hours`)
	}
	let hours = new Map()
	for (let property of node.properties) {
		let hour = Number(keyOf(property))
		if (!HOURS.includes(hour) || hours.has(hour)) {
			throw new Error(`ksto-schedule: ${day} has an unexpected or repeated hour ${keyOf(property)}`)
		}
		hours.set(hour, readSlot(property.value, shows, `${day} at ${hour}:00`))
	}
	let missing = HOURS.filter((hour) => !hours.has(hour))
	if (missing.length > 0) {
		throw new Error(
			`ksto-schedule: ${day} has no entry for ${missing.map((h) => `${h}:00`).join(', ')}`,
		)
	}
	return HOURS.map((hour) => hours.get(hour))
}

const clock = (hour) => `${String(hour).padStart(2, '0')}:00`

/**
 * Every show on the week's schedule, as a day, a start and an end in the
 * station's time. Neighbouring hours of one show become one slot, ending at
 * 24:00 at the latest; a show is never carried across midnight, so each slot
 * belongs to one day. Throws rather than return part of a week: a day or hour
 * missing, or an entry this does not understand, means the post changed shape
 * and a person should look before anything is written.
 */
export function parseSchedule(script) {
	let program
	try {
		program = parse(script, {ecmaVersion: 'latest', sourceType: 'script'})
	} catch (error) {
		throw new Error(`ksto-schedule: the post's script does not parse: ${error.message}`)
	}
	let found = declarations(program)
	let shows = readShows(found.get('shows'))

	let table = found.get('nowPlaying')
	if (table?.type !== 'ObjectExpression') {
		throw new Error('ksto-schedule: `nowPlaying` is not an object of days')
	}
	let days = new Map()
	for (let property of table.properties) {
		let index = Number(keyOf(property))
		let day = DAYS[index]
		if (!day || days.has(day)) {
			throw new Error(`ksto-schedule: unexpected or repeated day ${keyOf(property)}`)
		}
		days.set(day, readDay(property.value, shows, day))
	}
	let missing = DAYS.filter((day) => !days.has(day))
	if (missing.length > 0) {
		throw new Error(`ksto-schedule: missing ${missing.join(', ')}`)
	}

	let slots = []
	for (let day of DAY_ORDER) {
		let hours = days.get(day)
		for (let hour = 0; hour < hours.length; hour++) {
			let show = hours[hour]
			if (!show) continue
			let end = hour + 1
			while (end < hours.length && hours[end] === show) end++
			slots.push({day, start: clock(hour), end: clock(end), ...show})
			hour = end - 1
		}
	}
	return slots
}

const HEADER = `# KSTO's weekly show schedule, from the Now Playing post on kstoradio.org:
# ${SOURCE_PAGE}
# scripts/scrape-ksto-schedule.mjs rewrites this file from that post; see AGENTS.md.
# Times are the station's (timezone below). \`updated\` is when KSTO last edited
# the post, so a reader can tell a schedule left over from an earlier term.
`

/**
 * A quoted YAML string, quoted as oxfmt would: single quotes, unless the text
 * holds more of them than double quotes. Always quoted, so a title such as
 * "yes" or "1984" stays a string.
 */
function quote(text) {
	let singles = text.split("'").length - 1
	let doubles = text.split('"').length - 1
	return singles > doubles ? JSON.stringify(text) : `'${text.replaceAll("'", "''")}'`
}

/** One slot as a YAML list entry, a field to a line. */
function renderSlot({day, start, end, title, genre, poster}) {
	let fields = [`day: ${day}`, `start: '${start}'`, `end: '${end}'`, `title: ${quote(title)}`]
	if (genre) fields.push(`genre: ${quote(genre)}`)
	if (poster) fields.push(`poster: ${quote(poster)}`)
	return fields.map((field, index) => `${index === 0 ? '  - ' : '    '}${field}`).join('\n')
}

/** The whole of data/ksto-schedule.yaml for this schedule. */
export function renderSchedule({updated, slots}) {
	let lines = [`updated: '${updated}'`, `timezone: ${TIMEZONE}`, 'shows:', ...slots.map(renderSlot)]
	return `${HEADER}${lines.join('\n')}\n`
}

const describe = ({day, start, end, title}) => `${day} ${start}–${end} ${title}`

/** What makes two slots the same: a show that moves or is renamed counts as a change. */
const slotKey = (slot) => `${slot.day} ${slot.start} ${slot.end} ${slot.title}`

/** The slots only one side has, as readable lines for the run's summary. */
export function diffSchedule(ours, theirs) {
	let before = new Set((ours ?? []).map(slotKey))
	let after = new Set(theirs.map(slotKey))
	return {
		added: theirs.filter((slot) => !before.has(slotKey(slot))).map(describe),
		removed: (ours ?? []).filter((slot) => !after.has(slotKey(slot))).map(describe),
	}
}
