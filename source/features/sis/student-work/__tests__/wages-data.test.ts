import bundled from '../../../../../docs/student-wages.json'
import {PublishedWagesSchema} from '../wages'

describe('student-wages.yaml', () => {
	test('passes the check the app runs on the published copy', () => {
		expect(() => PublishedWagesSchema.parse(bundled)).not.toThrow()
	})
})

describe('PublishedWagesSchema', () => {
	// A missing tier would show "$NaN/hr" on every posting with that code.
	test('refuses a structure missing a tier', () => {
		let data = {
			ST: {1: 12, 2: 12.5},
			NST: {1: 13.5, 2: 14.5, 3: 15.5},
			OSA: {1: 12.5, 2: 13.25, 3: 14},
		}
		expect(() => PublishedWagesSchema.parse({data})).toThrow()
	})

	test('refuses a rate of zero', () => {
		let data = {
			ST: {1: 0, 2: 12.5, 3: 13},
			NST: {1: 13.5, 2: 14.5, 3: 15.5},
			OSA: {1: 12.5, 2: 13.25, 3: 14},
		}
		expect(() => PublishedWagesSchema.parse({data})).toThrow()
	})
})
