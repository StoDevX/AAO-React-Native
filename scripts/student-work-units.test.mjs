import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {
	classifyUnassigned,
	formatReport,
	parseUnitNames,
	unitFieldOf,
	unitNumberOf,
} from './student-work-units.mjs'

let description = (name) =>
	JSON.parse(readFileSync(new URL(`fixtures/student-work/${name}.json`, import.meta.url), 'utf8'))
		.items[0].ExternalDescriptionStr

let posting = (id, title, unitField) => ({
	id,
	title,
	url: `https://jobs.example/job/${id}`,
	unitField,
})

test('reads a unit number written after a bold label', () => {
	assert.equal(unitFieldOf(description('detail-clean')), '15120')
})

test('reads a unit number that the label and value share one bold span', () => {
	// "**Unit Number (5 digits): 11707**" -- the whole line is bold.
	assert.equal(unitFieldOf(description('detail-mistyped')), '11-707')
})

test('trims the non-breaking space some editors leave after the value', () => {
	assert.equal(unitFieldOf(description('detail-trailing-space')), '11681')
})

test('stops at the end of the line rather than reading the next label', () => {
	// The label is there with nothing after it; "Length of Position" follows.
	assert.equal(unitFieldOf(description('detail-blank')), '')
})

test('reads a unit number that shares its paragraph with another label', () => {
	// "Department Name: College Events<br>Unit Number (5 digits): 16322", one <p>.
	let {items} = JSON.parse(
		readFileSync(
			new URL(
				'../modules/ccc-jobs/__tests__/fixtures/detail-no-description-label.json',
				import.meta.url,
			),
			'utf8',
		),
	)
	assert.equal(unitFieldOf(items[0].ExternalDescriptionStr), '16322')
})

test('ends a line at a closing paragraph even with no newline after it', () => {
	let html = '<p><b>Unit Number:</b>&nbsp;</p><p><b>Length of Position:</b> One year</p>'
	assert.equal(unitFieldOf(html), '')
})

test('never turns escaped markup back into a tag', () => {
	// The field lands in an issue body, so decoding `&lt;` after stripping tags
	// would let a posting write HTML into it.
	let html = '<p><b>Unit Number:</b> &lt;script&gt;11707</p>'
	assert.equal(unitFieldOf(html), '&lt;script&gt;11707')
})

test('keeps whatever else was written in the field', () => {
	assert.equal(unitFieldOf(description('detail-account-string')), '41203-11184-53000-00512')
	assert.equal(unitFieldOf(description('detail-not-applicable')), 'n/a')
})

test('gives nothing for a posting whose template has no unit number line', () => {
	assert.equal(unitFieldOf(description('detail-no-unit-label')), undefined)
})

test('gives nothing for a posting with no description', () => {
	assert.equal(unitFieldOf(''), undefined)
	assert.equal(unitFieldOf(undefined), undefined)
})

test('takes a five-digit unit, with or without its fund', () => {
	assert.equal(unitNumberOf('15120'), '15120')
	assert.equal(unitNumberOf('10-15120'), '15120')
	assert.equal(unitNumberOf('900-23040'), '23040')
})

test('refuses anything that is not a unit number', () => {
	for (let value of ['', 'n/a', '11-707', '41203-11184-53000-00512', '1512', '151200', undefined]) {
		assert.equal(unitNumberOf(value), undefined, `${value}`)
	}
})

test('names units from the work-authorisation list, whatever the fund', () => {
	let names = parseUnitNames([
		'10-15120 | Admissions Office\r',
		'900-23040 | Bon Appetit-Sto Cost Ctr Charg\r',
		'not a unit',
	])
	assert.equal(names.get('15120'), 'Admissions Office')
	assert.equal(names.get('23040'), 'Bon Appetit-Sto Cost Ctr Charg')
	assert.equal(names.size, 2)
})

test('groups postings by the unlisted unit they carry', () => {
	let result = classifyUnassigned(
		[
			posting('1', 'Senior Admissions Fellow', '15120'),
			posting('2', 'Admissions Fellow', '10-15120'),
			posting('3', 'Intl Student Worker', '11681'),
		],
		new Set(['22005']),
	)

	assert.deepEqual(
		[...result.unlisted].map(([unit, postings]) => [unit, postings.map((p) => p.id)]),
		[
			['15120', ['1', '2']],
			['11681', ['3']],
		],
	)
	assert.deepEqual(result.missed, [])
	assert.deepEqual(result.unreadable, [])
})

test('sets aside a listed unit that the keyword search still missed', () => {
	let result = classifyUnassigned(
		[posting('4', 'Football Data Entry', '11707')],
		new Set(['11707']),
	)
	assert.equal(result.unlisted.size, 0)
	assert.deepEqual(
		result.missed.map((p) => p.id),
		['4'],
	)
})

test('sets aside postings whose unit number cannot be read', () => {
	let result = classifyUnassigned(
		[
			posting('5', 'Tutor', ''),
			posting('6', 'Community Assistant', undefined),
			posting('7', 'Football Data Entry', '11-707'),
		],
		new Set(),
	)
	assert.equal(result.unlisted.size, 0)
	assert.deepEqual(
		result.unreadable.map((p) => p.id),
		['5', '6', '7'],
	)
})

test('reports each unlisted unit with its name, count, and a sample title', () => {
	let result = classifyUnassigned(
		[
			posting('1', 'Senior Admissions Fellow', '15120'),
			posting('2', 'Admissions Fellow', '15120'),
			posting('3', 'Mystery Job', '99999'),
		],
		new Set(),
	)
	let report = formatReport(result, new Map([['15120', 'Admissions Office']]))

	assert.match(
		report,
		/\| `15120` \| Admissions Office \| 2 \| \[Senior Admissions Fellow\]\(https:\/\/jobs\.example\/job\/1\) \|/u,
	)
	assert.match(report, /\| `99999` \| \*not on the list\* \| 1 \| \[Mystery Job\]/u)
})

test('reports unreadable and missed postings with what the field said', () => {
	let result = classifyUnassigned(
		[
			posting('5', 'Tutor', ''),
			posting('6', 'Community Assistant', undefined),
			posting('7', 'Football Data Entry', '11-707'),
			posting('8', 'Scorekeeper', '11707'),
		],
		new Set(['11707']),
	)
	let report = formatReport(result, new Map())

	assert.match(report, /\[Tutor\]\(https:\/\/jobs\.example\/job\/5\) \| \*blank\* \|/u)
	assert.match(report, /\[Community Assistant\]\(.*\) \| \*no unit number line\* \|/u)
	assert.match(report, /\[Football Data Entry\]\(.*\) \| `11-707` \|/u)
	assert.match(report, /\[Scorekeeper\]\(.*\) \| `11707` \|/u)
})

test('escapes a pipe in a title so the table keeps its columns', () => {
	let result = classifyUnassigned([posting('1', 'Tutor | Grader', '15120')], new Set())
	assert.match(formatReport(result, new Map()), /\[Tutor \\\| Grader\]/u)
})

test('says so when every posting has an area', () => {
	let result = classifyUnassigned([], new Set())
	assert.equal(formatReport(result, new Map()), 'Every posting on the board is in an area.\n')
})
