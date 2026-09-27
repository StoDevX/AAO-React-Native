// Explains why a Student Work posting falls in no area, from the unit number
// its description carries. Everything here is pure, so
// scripts/student-work-units.test.mjs covers it against saved postings;
// scripts/check-student-work-areas.mjs does the fetching.

/** A block's end, however the editor wrote it: the template puts each label on its own paragraph or line. */
const LINE_END = /<br\s*\/?>|<\/(?:p|div|li|h[1-6])>/giu
const TAG = /<[^>]*>/gu
const NAMED = {nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"}

let decode = (text) =>
	text.replaceAll(/&(#\d+|[a-z]+);/giu, (entity, body) => {
		if (body.startsWith('#')) return String.fromCodePoint(Number.parseInt(body.slice(1), 10))
		return NAMED[body.toLowerCase()] ?? entity
	})

/** "Unit Number:" or "Unit Number (5 digits):", then the value up to the end of its line. */
const UNIT_LINE = /^\s*unit number[^:\n]*:(.*)$/imu

/**
 * What a posting's description writes after "Unit Number", trimmed: often a
 * unit, sometimes blank, a typo, or an account string. Undefined when the
 * description has no such line at all.
 */
export function unitFieldOf(html) {
	if (!html) return

	let text = decode(html.replaceAll(LINE_END, '\n').replaceAll(TAG, ''))
	let match = UNIT_LINE.exec(text)
	return match ? match[1].trim() : undefined
}

/** A unit alone (`15120`) or after its fund (`10-15120`), as the work-authorisation list writes it. */
const UNIT_NUMBER = /^(?:\d{2,3}-)?(\d{5})$/u

/** The five-digit unit in a field, or undefined when the field holds anything else. */
export function unitNumberOf(field) {
	return UNIT_NUMBER.exec(field ?? '')?.[1]
}

const UNIT_NAME = /^\d{2,3}-(\d{5}) \| (.+)$/u

/**
 * Unit names from the work-authorisation list, whose entries read
 * "10-15120 | Admissions Office". No unit appears under two funds.
 */
export function parseUnitNames(entries) {
	let names = new Map()
	for (let entry of entries) {
		let match = UNIT_NAME.exec(entry.trim())
		if (match) names.set(match[1], match[2].trim())
	}
	return names
}

/**
 * Sorts postings that no area's search found into three groups:
 *
 * - `unlisted`: carries a unit that no area lists, keyed by that unit. These
 *   are the ones an edit to data/student-work-areas.yaml can fix.
 * - `missed`: carries a unit an area does list, but that unit's keyword search
 *   did not find it.
 * - `unreadable`: the unit number is missing, blank, or not a unit number.
 */
export function classifyUnassigned(postings, listedUnits) {
	let unlisted = new Map()
	let missed = []
	let unreadable = []

	for (let posting of postings) {
		let unit = unitNumberOf(posting.unitField)
		if (unit === undefined) {
			unreadable.push(posting)
		} else if (listedUnits.has(unit)) {
			missed.push(posting)
		} else {
			let group = unlisted.get(unit) ?? []
			group.push(posting)
			unlisted.set(unit, group)
		}
	}

	return {unlisted, missed, unreadable}
}

let cell = (text) => text.replaceAll('|', '\\|')
let link = (posting) => `[${cell(posting.title)}](${posting.url})`

function describeField(field) {
	if (field === undefined) return '*no unit number line*'
	if (field === '') return '*blank*'
	return `\`${cell(field)}\``
}

/** The report as Markdown, for an issue body and the run summary. */
export function formatReport({unlisted, missed, unreadable}, names) {
	if (unlisted.size === 0 && missed.length === 0 && unreadable.length === 0) {
		return 'Every posting on the board is in an area.\n'
	}

	let sections = []

	if (unlisted.size > 0) {
		sections.push(
			[
				'## Units no area lists',
				'',
				'Add each to an area in `data/student-work-areas.yaml`, with its name as a comment.',
				'',
				'| Unit | Name | Postings | Example |',
				'| --- | --- | --- | --- |',
				...Array.from(
					unlisted,
					([unit, postings]) =>
						`| \`${unit}\` | ${cell(names.get(unit) ?? '*not on the list*')} | ${postings.length} | ${link(postings[0])} |`,
				),
			].join('\n'),
		)
	}

	if (missed.length > 0) {
		sections.push(
			[
				'## Listed units the search missed',
				'',
				"These carry a unit an area lists, but Oracle's keyword search for that unit did not return them.",
				'',
				'| Posting | Unit Number |',
				'| --- | --- |',
				...missed.map((posting) => `| ${link(posting)} | ${describeField(posting.unitField)} |`),
			].join('\n'),
		)
	}

	if (unreadable.length > 0) {
		sections.push(
			[
				'## Postings without a readable unit number',
				'',
				'No edit to the areas file can place these; the posting itself needs a unit number.',
				'',
				'| Posting | Unit Number |',
				'| --- | --- |',
				...unreadable.map(
					(posting) => `| ${link(posting)} | ${describeField(posting.unitField)} |`,
				),
			].join('\n'),
		)
	}

	return `${sections.join('\n\n')}\n`
}
