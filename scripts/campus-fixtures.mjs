// A campus's UI-test recordings: what a recording run of its campus tests
// fetched, keyed as source/features/campus/fixtures.ts looks them up.

import {TEC_MAX_PAGES} from '../modules/ccc-calendar/parsers/tec-pages.ts'
import {TEC_EVENTS, undatedUrl} from '../source/features/campus/fixture-dates.ts'

/** A body larger than this is refused unless asked for, so a smoke test cannot pull a whole feed in unnoticed. */
export const LARGE_BODY_BYTES = 200 * 1024

/** An object's named keys alone, those it has. */
function pick(object, keys) {
	return Object.fromEntries(keys.filter((key) => key in object).map((key) => [key, object[key]]))
}

/** A TEC event as `TecEventSchema` (modules/ccc-calendar/parsers/tec-events.ts) reads it. */
function tecEvent(event) {
	let {venue, organizer, categories} = event
	return {
		...pick(event, ['title', 'description', 'url', 'all_day', 'utc_start_date', 'utc_end_date']),
		...(venue === undefined ? {} : {venue: Array.isArray(venue) ? venue : pick(venue, ['venue'])}),
		...(organizer === undefined ? {} : {organizer: organizer.map((o) => pick(o, ['organizer']))}),
		...(categories === undefined ? {} : {categories: categories.map((c) => pick(c, ['name']))}),
	}
}

/** A Presence event as `PresenceEventSchema` (modules/ccc-calendar/parsers/presence.ts) reads it. */
const PRESENCE_FIELDS = [
	'eventName',
	'organizationName',
	'uri',
	'description',
	'location',
	'startDateTimeUtc',
	'endDateTimeUtc',
	'hasCoverImage',
	'photoUriWithVersion',
]

/**
 * The feeds whose answers keep only the fields their parser reads: the
 * calendars, whose unread fields are most of their size, and Presence's
 * include its organizers' names and email addresses. A parser that starts
 * reading a field adds it here, or the recording will not have it.
 */
const TRIMS = [
	{
		matches: TEC_EVENTS,
		trim: (page) => ({...pick(page, ['next_rest_url']), events: page.events.map(tecEvent)}),
	},
	{
		matches: /api\.presence\.io\//u,
		trim: (events) => events.map((event) => pick(event, PRESENCE_FIELDS)),
	},
]

/** A recorded body with what its parser never reads taken out; any other body as it came. */
export function trimmedBody(key, body) {
	let rule = TRIMS.find(({matches}) => matches.test(key))
	return rule ? JSON.stringify(rule.trim(JSON.parse(body))) : body
}

/**
 * An email address, which a recording keeps as `person@example.com`: feeds name
 * people in their text. A match starts only where a run of address characters
 * does, or a long run with no `@` would be tried from every one of its
 * characters; and an image named for its scale, `logo@2x.png`, is no address.
 */
const EMAIL = /(?<![\w.%+-])[\w.%+-]+@[\w.-]+\.(?!(?:png|jpe?g|gif|webp|svg)\b)[a-z]{2,}\b/giu

/**
 * A feed's answer, parsed, or undefined for an error or a body that is not
 * JSON: those are kept as they came, for the recording to say what went wrong.
 */
function feedOf({status, body}) {
	if (status < 200 || status >= 300) return
	try {
		return JSON.parse(body)
	} catch {
		return
	}
}

/** An answer's body as a recording keeps it: trimmed, and with no one's email address. */
function recordedBody(key, answer) {
	let kept = feedOf(answer) === undefined ? answer.body : trimmedBody(key, answer.body)
	return kept.replaceAll(EMAIL, 'person@example.com')
}

/** `body`, unless it is over 200 KB and large ones were not allowed. */
function checkedSize(key, body, allowLarge) {
	let bytes = Buffer.byteLength(body)
	if (!allowLarge && bytes > LARGE_BODY_BYTES) {
		throw new Error(`${key} answered ${bytes} bytes; rerun with --allow-large to keep it`)
	}
	return body
}

/** The requests that did not answer 2xx, with their status, for the summary. */
export function failedKeys(table) {
	return Object.entries(table)
		.filter(([, {status}]) => status < 200 || status >= 300)
		.map(([key, {status}]) => `${key} (${status})`)
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Each calendar feed's start and end times, and how it writes them: an ISO
 * instant, with or without milliseconds, or TEC's "YYYY-MM-DD HH:MM:SS" in
 * UTC.
 */
const CALENDARS = [
	{matches: /\/calendar\/named\//u, events: (body) => body, fields: ['startTime', 'endTime']},
	{
		matches: /api\.presence\.io\//u,
		events: (body) => body,
		fields: ['startDateTimeUtc', 'endDateTimeUtc'],
	},
	{
		matches: TEC_EVENTS,
		events: (body) => body.events,
		fields: ['utc_start_date', 'utc_end_date'],
	},
]

/** A recorded time as an instant. */
function instantOf(stamp) {
	return new Date(stamp.includes('T') ? stamp : `${stamp.replace(' ', 'T')}Z`)
}

/** How far the colleges' clocks are from UTC at `instant`, in milliseconds. */
function campusOffset(instant) {
	let name = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/Chicago',
		timeZoneName: 'shortOffset',
	})
		.formatToParts(instant)
		.find((part) => part.type === 'timeZoneName').value
	let [, hours = '0'] = /GMT([+-]\d+)?/u.exec(name)
	return Number(hours) * 60 * 60 * 1000
}

/**
 * A recorded time moved by some days, written as its feed writes it. It keeps
 * its time of day at the colleges, so an event moved across a change of
 * clocks stays where it was in the evening rather than slipping an hour.
 */
function shiftStamp(stamp, days) {
	let from = instantOf(stamp)
	let moved = new Date(from.getTime() + days * DAY_MS)
	let iso = new Date(moved.getTime() + campusOffset(from) - campusOffset(moved)).toISOString()
	if (!stamp.includes('T')) return iso.slice(0, 19).replace('T', ' ')
	return stamp.includes('.') ? iso : iso.replace(/\.\d{3}Z$/u, 'Z')
}

/** The day an instant falls on at the colleges, as YYYY-MM-DD. */
export function campusDay(instant) {
	return instant.toLocaleDateString('en-CA', {timeZone: 'America/Chicago'})
}

/** Days from `from` to `to`, both YYYY-MM-DD. */
function daysBetween(from, to) {
	return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS)
}

/**
 * A campus's calendars moved back by whole weeks, all by the same amount, so
 * the first day from the recording on that has an event starting and falls on
 * the frozen day's weekday becomes the UI tests' frozen day. The feeds answer
 * from the day they are asked, so the frozen day would otherwise show
 * nothing; this asks no feed to keep serving the past. Whole weeks keep each
 * event on its own weekday, which titles such as "Friday Morning" name. An
 * event that began earlier, such as a running exhibition, moves with the
 * rest. Calendars recorded on the frozen day are left as they came.
 */
export function shiftCalendars(table, {frozenDay, recordedDay}) {
	let calendars = Object.keys(table).flatMap((key) => {
		let calendar = CALENDARS.find(({matches}) => matches.test(key))
		let body = calendar && feedOf(table[key])
		return body ? [{key, calendar, body}] : []
	})
	let eventDays = calendars
		.flatMap(({calendar, body}) =>
			calendar.events(body).flatMap((event) => {
				let start = event[calendar.fields[0]]
				return start ? [campusDay(instantOf(start))] : []
			}),
		)
		.filter((day) => day >= recordedDay)
		.sort((a, b) => a.localeCompare(b))
	let anchor =
		eventDays.find((day) => daysBetween(day, frozenDay) % 7 === 0) ?? eventDays[0] ?? recordedDay
	let days = Math.floor(daysBetween(anchor, frozenDay) / 7) * 7
	if (days >= 0) return table

	let shifted = {...table}
	for (let {key, calendar, body} of calendars) {
		for (let event of calendar.events(body)) {
			for (let field of calendar.fields) {
				if (event[field]) event[field] = shiftStamp(event[field], days)
			}
		}
		shifted[key] = {...table[key], body: JSON.stringify(body)}
	}
	return shifted
}

/**
 * A TEC page's key as the app writes it: `fixtureKey` in
 * source/features/campus/fixtures.ts writes the window's dates `{date}`.
 */
function tecPageKey(url) {
	return `GET ${undatedUrl(url)}`
}

/**
 * A campus's recordings with every page of the St. Olaf calendar: the app
 * reads them one after another, and a test can finish while it still is.
 * `fetchPage(url)` answers a page as `{status, contentType, body}`.
 */
export async function completeTecPages(table, fetchPage, {allowLarge = false} = {}) {
	let complete = {...table}
	let pending = Object.keys(complete).filter((key) => TEC_EVENTS.test(key))
	let pages = pending.length
	while (pending.length > 0) {
		let next = feedOf(complete[pending.shift()])?.next_rest_url
		if (!next || tecPageKey(next) in complete) continue
		if (pages === TEC_MAX_PAGES) {
			throw new Error(`the TEC feed ran past ${TEC_MAX_PAGES} pages, where the app stops too`)
		}
		let key = tecPageKey(next)
		// Sequential by nature: each page names the next.
		// oxlint-disable-next-line eslint/no-await-in-loop
		let answer = await fetchPage(next)
		let body = checkedSize(key, recordedBody(key, answer), allowLarge)
		complete[key] = {status: answer.status, contentType: answer.contentType, body}
		pages += 1
		pending.push(key)
	}
	return complete
}

/** The recording's lines as the fixture table, keys sorted, the last answer to each request kept. */
export function mergeCampusRecordings(lines, {allowLarge = false} = {}) {
	let table = {}
	for (let text of lines) {
		if (!text.trim()) continue
		let {key, status, contentType, body: answered} = JSON.parse(text)
		let body = checkedSize(key, recordedBody(key, {status, body: answered}), allowLarge)
		table[key] = {status, contentType, body}
	}
	if (Object.keys(table).length === 0) {
		throw new Error('nothing was recorded; the fixtures are left as they were')
	}
	return Object.fromEntries(
		Object.keys(table)
			.sort()
			.map((key) => [key, table[key]]),
	)
}

/** A request's file name: its method and where it went, as a path-safe slug. */
function fileName(key) {
	let [method, target] = key.split(' ')
	let where = target.replace(/^\{server:[^}]+\}\//u, '').replace(/^https?:\/\//u, '')
	return `${method}-${where.replaceAll(/[^\w.]+/gu, '-').replaceAll(/^-|-$/gu, '')}.json`
}

/** Whether a content type is JSON's. */
function isJson(contentType) {
	return /\bjson\b/u.test(contentType ?? '')
}

/** An object's keys in order, all the way down, so a file's diff shows what moved. */
function sortKeys(value) {
	if (Array.isArray(value)) return value.map(sortKeys)
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, sortKeys(value[key])]),
		)
	}
	return value
}

/**
 * A campus's recordings as files, one per request, and the index that
 * imports them: Metro cannot read a folder, only the imports it is given. A
 * JSON answer is kept as JSON, anything else as its text.
 */
export function campusFixtureFiles(table) {
	let files = {}
	for (let [key, {status, contentType, body}] of Object.entries(table)) {
		let name = fileName(key)
		for (let n = 2; name in files; n++) name = fileName(key).replace(/\.json$/u, `-${n}.json`)
		let answer = {text: body}
		if (isJson(contentType)) {
			try {
				answer = {json: JSON.parse(body)}
			} catch {
				// An empty or broken body stays as it came.
			}
		}
		files[name] = `${JSON.stringify(sortKeys({key, status, contentType, ...answer}), null, '\t')}\n`
	}
	let names = Object.keys(files).sort()
	let index = [
		'// Written by `mise run update-campus-fixtures`; rerecord rather than edit.',
		...names.map((name, i) => `import f${i} from './${name}'`),
		'',
		`export default [${names.map((_, i) => `f${i}`).join(', ')}]`,
		'',
	].join('\n')
	return {files, index}
}
