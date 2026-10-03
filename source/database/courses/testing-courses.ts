import type {FixtureCourse} from './fixture.ts'

/** A course with every field the catalog carries, overridable per test. Test-only. */
export function makeCourse(overrides: Partial<FixtureCourse> = {}): FixtureCourse {
	return {
		clbid: 1,
		credits: 1,
		crsid: 10,
		department: 'MATH',
		description: ['Groups, rings and fields.'],
		enrolled: 5,
		gereqs: ['WRI'],
		instructors: ['Jill Dietz'],
		level: 200,
		max: 20,
		name: 'Abstract Algebra',
		notes: ['Meets in RNS 310.'],
		number: 252,
		offerings: [{day: 'Mo', start: '10:00', end: '11:00', location: 'RNS 310'}],
		pn: false,
		prerequisites: false,
		semester: 1,
		status: 'O',
		term: 20261,
		type: 'Research',
		year: 2026,
		...overrides,
	}
}
