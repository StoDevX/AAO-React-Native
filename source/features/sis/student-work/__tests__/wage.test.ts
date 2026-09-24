import {hourlyWage, jobRowDetail} from '../lib'

describe('hourlyWage', () => {
	test('looks up each structure and tier', () => {
		expect(hourlyWage({structure: 'ST', tier: 1})).toBe(12)
		expect(hourlyWage({structure: 'ST', tier: 3})).toBe(13)
		expect(hourlyWage({structure: 'NST', tier: 2})).toBe(14.5)
		expect(hourlyWage({structure: 'OSA', tier: 3})).toBe(14)
	})
})

describe('jobRowDetail', () => {
	test('shows the wage beside the posted date', () => {
		expect(
			jobRowDetail({title: 'AY Stav Student Server (WS-NST1)', postedDate: '2026-08-08'}, 'en-US'),
		).toBe('$13.50/hr · Posted Aug 8, 2026')
	})

	test('shows only the posted date when the title has no pay code', () => {
		expect(
			jobRowDetail(
				{title: 'CURI Academic Year Student Researcher - Braun', postedDate: '2026-09-16'},
				'en-US',
			),
		).toBe('Posted Sep 16, 2026')
	})

	// Academic Year is nearly every posting's term, so only the others are
	// worth room on the row.
	test('leads with the term when it is not the academic year', () => {
		expect(
			jobRowDetail({title: 'F26 Biology Lab TA (WS-ST2)', postedDate: '2026-09-11'}, 'en-US'),
		).toBe('Fall · $12.50/hr · Posted Sep 11, 2026')
		expect(
			jobRowDetail({title: 'AY Mail Services Worker (WS-ST1)', postedDate: '2026-09-11'}, 'en-US'),
		).toBe('$12.00/hr · Posted Sep 11, 2026')
	})

	test('shows only the wage when the posted date cannot be read', () => {
		expect(jobRowDetail({title: 'Football Student Filmer (WS-ST1)', postedDate: ''}, 'en-US')).toBe(
			'$12.00/hr',
		)
	})
})
