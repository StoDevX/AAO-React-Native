import {parseDescription, parseDetail} from '../parsers/description'
import standard from './fixtures/detail-standard.json'
import romanNumerals from './fixtures/detail-roman-numerals.json'
import brSeparated from './fixtures/detail-no-description-label.json'
import summer from './fixtures/detail-summer.json'
import fundPrefix from './fixtures/detail-fund-prefix.json'
import twoUnits from './fixtures/detail-two-units.json'
import zeroWidth from './fixtures/detail-zero-width.json'
import mistyped from './fixtures/detail-mistyped-unit.json'
import unitNa from './fixtures/detail-unit-na.json'
import blankUnit from './fixtures/detail-blank-unit.json'
import noUnitLabel from './fixtures/detail-no-unit-label.json'

function descriptionOf(fixture: unknown): string {
	const item = (fixture as {items: Array<{ExternalDescriptionStr: string}>}).items[0]
	if (!item) throw new Error('fixture has no posting')
	return item.ExternalDescriptionStr
}

describe('parseDescription', () => {
	test('promotes the wage range to a field', () => {
		const {fields} = parseDescription(descriptionOf(standard))

		const wage = fields.find((field) => field.label === 'Wage')
		expect(wage).toBeDefined()
		expect(wage?.value).not.toBe('')
	})

	test('promotes the department to a field', () => {
		const {fields} = parseDescription(descriptionOf(standard))

		expect(fields.find((field) => field.label === 'Department')?.value).not.toBe('')
	})

	test('a promoted label is not left in the body', () => {
		const {body} = parseDescription(descriptionOf(standard))

		expect(body).not.toContain('Wage Range')
		expect(body).not.toContain('Department Name')
	})

	test('dropped labels appear neither as fields nor in the body', () => {
		const {fields, body} = parseDescription(descriptionOf(standard))

		expect(fields.map((field) => field.label)).not.toContain('Job Title')
		expect(body).not.toContain('Unit Number')
		expect(body).not.toContain('Name and Address of Employer')
	})

	test('keeps the unpromoted sections in the body as markdown', () => {
		const {body} = parseDescription(descriptionOf(standard))

		expect(body).toContain('**Duties and Responsibilities:**')
	})

	test('a roman-numeral heading is matched like its plain form', () => {
		const {fields} = parseDescription(descriptionOf(romanNumerals))

		expect(fields.find((field) => field.label === 'Department')).toBeDefined()
	})

	// Some postings put every label in one paragraph separated by `<br>` rather
	// than in a paragraph each. Read as one block, the first label swallows all
	// the others' text and the rest are lost.
	test.each([
		['bare', '<br>'],
		// How this editor actually writes a line break.
		['wrapped in a span', '<span><br></span>'],
	])('labels separated by a %s break are read one at a time', (_name, br) => {
		const {fields} = parseDescription(
			`<p><span style="font-weight:700">Department Name:</span> Athletics${br}` +
				'<span style="font-weight:700">Wage Range:</span> $12.00/hour</p>',
		)

		expect(fields).toEqual([
			{label: 'Department', value: 'Athletics'},
			{label: 'Wage', value: '$12.00/hour'},
		])
	})

	test('a br-separated posting keeps its labels apart', () => {
		const {fields} = parseDescription(descriptionOf(brSeparated))

		expect(fields.find((field) => field.label === 'Department')?.value).toBe('College Events')
		expect(fields.find((field) => field.label === 'Wage')?.value).toBe('$12.00-13.00/hour')
	})

	test('a missing label yields no field rather than an empty one', () => {
		const {fields} = parseDescription('<p>Just prose, no labels at all.</p>')

		expect(fields).toEqual([])
	})

	test('an unrecognised description becomes the body whole', () => {
		const {body} = parseDescription('<p>Just prose, no labels at all.</p>')

		expect(body).toBe('Just prose, no labels at all.')
	})

	test('a label with an empty value is not promoted', () => {
		const {fields} = parseDescription('<p><span style="font-weight:700">Wage Range:</span></p>')

		expect(fields).toEqual([])
	})

	test('an empty description yields nothing', () => {
		expect(parseDescription('')).toEqual({fields: [], body: '', unit: null})
	})
})

describe('parseDetail', () => {
	const URL = 'https://example.test/job/1'

	test('reads the header fields Oracle actually populates', () => {
		const detail = parseDetail(standard, URL)

		expect(detail.id).toMatch(/^\d+$/u)
		expect(detail.title).not.toBe('')
		expect(detail.category).toBe('Student Work')
		expect(detail.schedule).not.toBe('')
		expect(detail.url).toBe(URL)
	})

	test('reads the summer posting as its own category', () => {
		expect(parseDetail(summer, URL).category).toBe('Summer Student Work')
	})

	test('carries the scraped fields and body through', () => {
		const detail = parseDetail(standard, URL)

		expect(detail.fields.length).toBeGreaterThan(0)
		expect(detail.body).not.toBe('')
	})

	test('a posting with no description still parses', () => {
		const detail = parseDetail({items: [{Id: '1', Title: 'A job'}]}, URL)

		expect(detail.body).toBe('')
		expect(detail.fields).toEqual([])
	})

	test('an empty collection throws', () => {
		expect(() => parseDetail({items: []}, URL)).toThrow()
	})
})

describe('the unit a description names', () => {
	test.each([
		['standard', standard, '11725'],
		['summer', summer, '11727'],
		['roman numerals', romanNumerals, '15141'],
		['line-break separated', brSeparated, '16322'],
		['fund prefix', fundPrefix, '11725'],
		['two units', twoUnits, '13001'],
		['zero-width space', zeroWidth, '11150'],
		['mistyped', mistyped, null],
		['n/a', unitNa, null],
		['blank', blankUnit, null],
		['no label', noUnitLabel, null],
	])('%s', (_name, fixture, unit) => {
		expect(parseDescription(descriptionOf(fixture)).unit).toBe(unit)
	})

	test('stays out of the fields and the body', () => {
		const {fields, body} = parseDescription(descriptionOf(fundPrefix))

		expect(fields.map((field) => field.label)).not.toContain('Unit Number')
		expect(body).not.toContain('Unit Number')
	})

	test('reaches the parsed detail', () => {
		expect(parseDetail(standard, 'https://example.test/job/1').unit).toBe('11725')
	})
})
