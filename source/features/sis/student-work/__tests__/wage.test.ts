import {FIXED_WAGES} from '../fixed-wages'
import {hourlyWage, jobRowDetail} from '../lib'

describe('hourlyWage', () => {
	test('looks up each structure and tier', () => {
		expect(hourlyWage({structure: 'ST', tier: 1}, FIXED_WAGES)).toBe(12)
		expect(hourlyWage({structure: 'ST', tier: 3}, FIXED_WAGES)).toBe(13)
		expect(hourlyWage({structure: 'NST', tier: 2}, FIXED_WAGES)).toBe(14.5)
		expect(hourlyWage({structure: 'OSA', tier: 3}, FIXED_WAGES)).toBe(14)
	})

	test('reads the table it is given', () => {
		let raised = {...FIXED_WAGES, ST: {1: 12.25, 2: 12.5, 3: 13}}
		expect(hourlyWage({structure: 'ST', tier: 1}, raised)).toBe(12.25)
	})
})

describe('jobRowDetail', () => {
	test('shows the wage beside the posted date', () => {
		expect(
			jobRowDetail(
				{title: 'AY Stav Student Server (WS-NST1)', postedDate: '2026-08-08'},
				FIXED_WAGES,
				'en-US',
			),
		).toBe('$13.50/hr · Posted Aug 8, 2026')
	})

	test('leaves the wage off until the wages load', () => {
		expect(
			jobRowDetail(
				{title: 'AY Stav Student Server (WS-NST1)', postedDate: '2026-08-08'},
				undefined,
				'en-US',
			),
		).toBe('Posted Aug 8, 2026')
	})

	test('shows only the posted date when the title has no pay code', () => {
		expect(
			jobRowDetail(
				{title: 'CURI Academic Year Student Researcher - Braun', postedDate: '2026-09-16'},
				FIXED_WAGES,
				'en-US',
			),
		).toBe('Posted Sep 16, 2026')
	})

	// Academic Year is nearly every posting's term, so only the others are
	// worth room on the row.
	test('leads with the term when it is not the academic year', () => {
		expect(
			jobRowDetail(
				{title: 'F26 Biology Lab TA (WS-ST2)', postedDate: '2026-09-11'},
				FIXED_WAGES,
				'en-US',
			),
		).toBe('Fall · $12.50/hr · Posted Sep 11, 2026')
		expect(
			jobRowDetail(
				{title: 'AY Mail Services Worker (WS-ST1)', postedDate: '2026-09-11'},
				FIXED_WAGES,
				'en-US',
			),
		).toBe('$12.00/hr · Posted Sep 11, 2026')
	})

	test('shows only the wage when the posted date cannot be read', () => {
		expect(
			jobRowDetail(
				{title: 'Football Student Filmer (WS-ST1)', postedDate: ''},
				FIXED_WAGES,
				'en-US',
			),
		).toBe('$12.00/hr')
	})
})
