// A campus's UI-test recordings: what a recording run of its campus tests
// fetched, keyed as source/features/campus/fixtures.ts looks them up.

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
		matches: /tribe\/events\/v1\/events/u,
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

/** The recording's lines as the fixture table, keys sorted, the last answer to each request kept. */
export function mergeCampusRecordings(lines, {allowLarge = false} = {}) {
	let table = {}
	for (let text of lines) {
		if (!text.trim()) continue
		let {key, status, contentType, body: answered} = JSON.parse(text)
		let body = trimmedBody(key, answered)
		let bytes = Buffer.byteLength(body)
		if (!allowLarge && bytes > LARGE_BODY_BYTES) {
			throw new Error(`${key} answered ${bytes} bytes; rerun with --allow-large to keep it`)
		}
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
