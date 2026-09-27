import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {load} from 'js-yaml'
import {diffWages, pageContent, parseWages, renderWages} from './student-wages.mjs'

let response = JSON.parse(
	readFileSync(new URL('fixtures/student-wages/compensation.json', import.meta.url), 'utf8'),
)

let PUBLISHED = {
	ST: {1: 12, 2: 12.5, 3: 13},
	NST: {1: 13.5, 2: 14.5, 3: 15.5},
	OSA: {1: 12.5, 2: 13.25, 3: 14},
}

let ROWS = [
	['Standard Tier 1 (ST1)', '$12.00/hour'],
	['Standard Tier 2 (ST2)', '$12.50/hour'],
	['Standard Tier 3 (ST3)', '$13.00/hour'],
	['Non-Standard Tier 1 (NST1)', '$13.50/hour'],
	['Non-Standard Tier 2 (NST2)', '$14.50/hour'],
	['Non-Standard Tier 3 (NST3)', '$15.50/hour'],
	['Office of Student Activities Tier 1 (OSA1)', '$12.50/hour'],
	['Office of Student Activities Tier 2 (OSA2)', '$13.25/hour'],
	['Office of Student Activities Tier 3 (OSA3)', '$14.00/hour'],
]

/** A table in the page's own shape, with a header row, from [label, rate] pairs. */
let table = (rows) =>
	`<table><thead><tr><th>Tier</th><th>Description</th><th>Pay Rate</th></tr></thead><tbody>${rows
		.map(
			([label, rate]) =>
				`<tr class="wpdt-cell-row "><td>${label}</td><td>Duties.</td><td>${rate}</td></tr>`,
		)
		.join('')}</tbody></table>`

test('parses all nine rates from the published page', () => {
	assert.deepEqual(parseWages(pageContent(response).html), PUBLISHED)
})

test('reads when the page was last modified', () => {
	assert.match(pageContent(response).modified, /^\d{4}-\d{2}-\d{2}T/u)
})

// A renamed slug returns an empty list rather than a 404.
test('refuses a response with no page in it', () => {
	assert.throws(() => pageContent([]), /expected one page/u)
})

test('refuses a page with no rendered content', () => {
	assert.throws(() => pageContent([{modified: 'x'}]), /content\.rendered/u)
})

test('throws when a whole structure is gone', () => {
	let html = table(ROWS.filter(([label]) => !label.includes('OSA')))
	assert.throws(() => parseWages(html), /missing OSA1, OSA2, OSA3/u)
})

// A page with its tables removed must fail rather than empty the table.
test('throws when the page has no tables', () => {
	assert.throws(() => parseWages('<p>Down for maintenance.</p>'), /missing ST1/u)
})

test('throws on a code the app does not know', () => {
	let html = table([...ROWS, ['Standard Tier 4 (ST4)', '$13.50/hour']])
	assert.throws(() => parseWages(html), /unknown pay code ST4/u)
})

test('throws on a code listed twice', () => {
	let html = table([...ROWS, ['Standard Tier 1 (ST1)', '$12.25/hour']])
	assert.throws(() => parseWages(html), /ST1 appears twice/u)
})

test('throws when a code row has no rate', () => {
	let html = table(ROWS.map(([label, rate]) => [label, label.includes('(ST1)') ? 'TBD' : rate]))
	assert.throws(() => parseWages(html), /no hourly rate in the ST1 row/u)
})

test('reads a rate without cents, with spaces or an entity before the slash', () => {
	let html = table(
		ROWS.map(([label, rate]) => {
			if (label.includes('(ST1)')) return [label, '$12/hour']
			if (label.includes('(ST2)')) return [label, '$12.50&nbsp;/ hour']
			return [label, rate]
		}),
	)
	let wages = parseWages(html)
	assert.equal(wages.ST[1], 12)
	assert.equal(wages.ST[2], 12.5)
})

test('renders each structure on one line, to the cent', () => {
	let yaml = renderWages(PUBLISHED)
	assert.match(yaml, /^ST: \{1: 12\.00, 2: 12\.50, 3: 13\.00\}$/mu)
	assert.match(yaml, /^OSA: \{1: 12\.50, 2: 13\.25, 3: 14\.00\}$/mu)
	assert.match(yaml, /student-employment-compensation-philosophy/u)
})

test('renders a file that reads back as the same rates', () => {
	assert.deepEqual(load(renderWages(PUBLISHED)), PUBLISHED)
})

test('lists each changed rate', () => {
	let theirs = {...PUBLISHED, NST: {...PUBLISHED.NST, 2: 14.75}}
	assert.deepEqual(diffWages(PUBLISHED, theirs), [{code: 'NST2', from: 14.5, to: 14.75}])
})

test('lists nothing when the rates match', () => {
	assert.deepEqual(diffWages(PUBLISHED, PUBLISHED), [])
})
