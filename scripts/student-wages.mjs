// Turns the WordPress REST response for St. Olaf's student compensation page
// into data/student-wages.yaml. Everything here is pure -- no network, no
// filesystem -- so scripts/student-wages.test.mjs exercises it against a saved
// response. scripts/scrape-student-wages.mjs does the I/O.
//
// The REST API rather than the page itself: the page repeats the article,
// tables included, inside a JSON-LD block, and the API returns it once.

import {htmlText} from './html-text.mjs'

export const SOURCE_PAGE =
	'https://wp.stolaf.edu/studentemployment/student-employment-compensation-philosophy/'

export const SOURCE_API =
	'https://wp.stolaf.edu/studentemployment/wp-json/wp/v2/pages?slug=student-employment-compensation-philosophy&_fields=modified,content'

/** The pay structures and tiers the app's `JobCode` type allows, in file order. */
export const STRUCTURES = ['ST', 'NST', 'OSA']
export const TIERS = [1, 2, 3]

const ROW = /<tr\b[^>]*>(.*?)<\/tr>/gsu
const CODE = /\(([A-Z]+)(\d+)\)/u
const RATE = /\$(\d+(?:\.\d{1,2})?)\s*\/\s*hour/u

/** The article's HTML and modified time, from the API's one-page list. */
export function pageContent(body) {
	if (!Array.isArray(body) || body.length !== 1) {
		let got = Array.isArray(body) ? `${body.length} pages` : typeof body
		throw new Error(`student-wages: expected one page from the API, got ${got}`)
	}
	let [page] = body
	let html = page?.content?.rendered
	if (typeof html !== 'string') {
		throw new TypeError('student-wages: the page has no content.rendered')
	}
	return {html, modified: String(page.modified ?? 'unknown')}
}

/**
 * Every structure's rate for every tier. Throws rather than return a partial
 * table: a code missing, repeated, unknown, or without a rate means the page
 * changed shape, and a person should look before anything is written.
 */
export function parseWages(html) {
	let found = new Map()
	for (let [, row] of html.matchAll(ROW)) {
		let cells = htmlText(row)
		let code = cells.match(CODE)
		// The header row names no code.
		if (!code) continue

		let [, structure, tierText] = code
		let key = `${structure}${tierText}`
		if (!STRUCTURES.includes(structure) || !TIERS.includes(Number(tierText))) {
			throw new Error(`student-wages: unknown pay code ${key}`)
		}
		if (found.has(key)) {
			throw new Error(`student-wages: ${key} appears twice`)
		}
		let rate = cells.match(RATE)
		if (!rate) {
			throw new Error(`student-wages: no hourly rate in the ${key} row: "${cells}"`)
		}
		found.set(key, Number(rate[1]))
	}

	let missing = STRUCTURES.flatMap((structure) =>
		TIERS.map((tier) => `${structure}${tier}`),
	).filter((key) => !found.has(key))
	if (missing.length > 0) {
		throw new Error(`student-wages: missing ${missing.join(', ')}`)
	}

	return Object.fromEntries(
		STRUCTURES.map((structure) => [
			structure,
			Object.fromEntries(TIERS.map((tier) => [tier, found.get(`${structure}${tier}`)])),
		]),
	)
}

const HEADER = `# Dollars an hour for student work, by pay structure and tier, from
# ${SOURCE_PAGE}
# scripts/scrape-student-wages.mjs rewrites this file from that page; see AGENTS.md.
`

/** The whole of data/student-wages.yaml for these rates. */
export function renderWages(wages) {
	let lines = STRUCTURES.map((structure) => {
		let tiers = TIERS.map((tier) => `${tier}: ${wages[structure][tier].toFixed(2)}`)
		return `${structure}: {${tiers.join(', ')}}`
	})
	return `${HEADER}${lines.join('\n')}\n`
}

/** Each rate that differs between two tables, as a pay code with old and new rates. */
export function diffWages(ours, theirs) {
	return STRUCTURES.flatMap((structure) =>
		TIERS.map((tier) => ({
			code: `${structure}${tier}`,
			from: ours?.[structure]?.[tier],
			to: theirs[structure][tier],
		})),
	).filter(({from, to}) => from !== to)
}
