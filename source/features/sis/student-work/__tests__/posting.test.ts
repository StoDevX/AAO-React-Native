import snapshot from '../../../../../modules/ccc-jobs/__tests__/fixtures/requisitions.json'
import {displayTitle, jobCode, jobTerm} from '../posting'

describe('jobCode', () => {
	test('reads the pay structure and tier from the title suffix', () => {
		expect(jobCode('AY Mail Services Student Worker (WS-ST1)')).toEqual({structure: 'ST', tier: 1})
		expect(jobCode('AY Stav Student Supervisor (WS-NST3)')).toEqual({structure: 'NST', tier: 3})
		expect(jobCode("AY Lion's Pause Kitchen Worker (WS-OSA1)")).toEqual({
			structure: 'OSA',
			tier: 1,
		})
	})

	test('tolerates a space before the tier and a doubled closing paren', () => {
		expect(jobCode('AY Deputy Secretary of Marketing and Communications (WS-OSA 1))')).toEqual({
			structure: 'OSA',
			tier: 1,
		})
	})

	test('finds nothing in a title without a code', () => {
		expect(jobCode('CURI Academic Year Student Researcher - Braun')).toBeUndefined()
	})

	test('ignores a tier the wage structure does not have', () => {
		expect(jobCode('Mystery Job (WS-ST7)')).toBeUndefined()
	})
})

describe('jobTerm', () => {
	test('reads an academic-year prefix, in each spelling the board uses', () => {
		expect(jobTerm('AY Mail Services Student Worker (WS-ST1)')).toBe('Academic Year')
		expect(jobTerm('AY 26-27 Lutheran Center Nourishing Vocation Student Fellow (WS-ST1)')).toBe(
			'Academic Year',
		)
		expect(jobTerm('2026-27 MSCS Mess Editor (WS-ST2)')).toBe('Academic Year')
	})

	test('reads "Academic Year" written out anywhere in the title', () => {
		expect(jobTerm('CURI Academic Year Student Researcher - Braun')).toBe('Academic Year')
	})

	test('reads a term word followed by its year', () => {
		expect(jobTerm('Fall 26 Biology 233A Student Teaching Assistant (WS-ST2)')).toBe('Fall')
		expect(jobTerm('Spring 27 Chemistry Grader (WS-ST2)')).toBe('Spring')
		expect(jobTerm('Summer 2027 Camp Counselor (WS-NST1)')).toBe('Summer')
		expect(jobTerm('AY 2026-27 Library Assistant (WS-ST1)')).toBe('Academic Year')
	})

	test('reads a spring code the way fall’s F26 is written', () => {
		expect(jobTerm('S27 Chemistry Grader (WS-ST2)')).toBe('Spring')
		expect(jobTerm('Sp27 Chemistry Grader (WS-ST2)')).toBe('Spring')
	})

	test('reads a semester prefix', () => {
		expect(jobTerm('F26 Biology 150 Lab A Student Teaching Assistant (WS-ST2)')).toBe('Fall')
		expect(jobTerm('Fall Dance 109 International Dance Student Class Assistant (WS-ST2)')).toBe(
			'Fall',
		)
		expect(jobTerm('Spring Chemistry Grader (WS-ST2)')).toBe('Spring')
		expect(jobTerm('Summer Physics Stockroom Student Assistant (WS-ST2)')).toBe('Summer')
	})

	test('finds no term in a title that does not state one', () => {
		expect(jobTerm('Football Student Filmer (WS-ST1)')).toBeUndefined()
	})

	test('does not mistake a word that merely starts with a term', () => {
		expect(jobTerm('Fallout Shelter Inspector (WS-ST1)')).toBeUndefined()
		expect(jobTerm('Ayurveda Student Assistant (WS-ST1)')).toBeUndefined()
	})
})

describe('displayTitle', () => {
	test('drops the term prefix and the pay code', () => {
		expect(displayTitle('AY Mail Services Student Worker (WS-ST1)')).toBe(
			'Mail Services Student Worker',
		)
		expect(
			displayTitle('AY 26-27 Lutheran Center Nourishing Vocation Student Fellow (WS-ST1)'),
		).toBe('Lutheran Center Nourishing Vocation Student Fellow')
		expect(displayTitle('F26 Biology 150 Lab A Student Teaching Assistant (WS-ST2)')).toBe(
			'Biology 150 Lab A Student Teaching Assistant',
		)
		expect(displayTitle('2026-27 MSCS Mess Editor (WS-ST2)')).toBe('MSCS Mess Editor')
	})

	test('drops a term word and the year after it', () => {
		expect(displayTitle('Fall 26 Biology 233A Student Teaching Assistant (WS-ST2)')).toBe(
			'Biology 233A Student Teaching Assistant',
		)
		expect(displayTitle('Summer 2027 Camp Counselor (WS-NST1)')).toBe('Camp Counselor')
		expect(displayTitle('AY 2026-27 Library Assistant (WS-ST1)')).toBe('Library Assistant')
		expect(displayTitle('Sp27 Chemistry Grader (WS-ST2)')).toBe('Chemistry Grader')
	})

	// The code is removed exactly where jobCode reads it, so a code it cannot
	// read stays visible -- it is then the posting's only pay information --
	// and one it can read never lingers in the title.
	test('keeps a pay code it cannot read', () => {
		expect(jobCode('Foo Worker (WS-ST1/2)')).toBeUndefined()
		expect(displayTitle('Foo Worker (WS-ST1/2)')).toBe('Foo Worker (WS-ST1/2)')
	})

	test('drops a readable pay code from the middle of a title', () => {
		expect(jobCode('Stav Server (WS-NST1) - Evenings')).toEqual({structure: 'NST', tier: 1})
		expect(displayTitle('Stav Server (WS-NST1) - Evenings')).toBe('Stav Server - Evenings')
	})

	test('leaves no term or pay code in any title on the board snapshot', () => {
		for (let {Title} of snapshot.items[0]?.requisitionList ?? []) {
			let shown = displayTitle(Title)
			expect({Title, shown}).toEqual({Title, shown: expect.not.stringMatching(/^\d|\(WS-|^AY /u)})
		}
	})

	test('drops a pay code with a doubled closing paren', () => {
		expect(displayTitle('AY Deputy Secretary of Marketing and Communications (WS-OSA 1))')).toBe(
			'Deputy Secretary of Marketing and Communications',
		)
	})

	test('keeps other parentheses', () => {
		expect(displayTitle('AY Residence Life Graphic Designer (RFA) (WS-ST3)')).toBe(
			'Residence Life Graphic Designer (RFA)',
		)
	})

	test('leaves a title with nothing to drop alone', () => {
		expect(displayTitle('CURI Academic Year Student Researcher - Braun')).toBe(
			'CURI Academic Year Student Researcher - Braun',
		)
	})
})
