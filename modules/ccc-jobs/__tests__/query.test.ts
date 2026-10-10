import {describe, expect, test} from '@jest/globals'
import {jobPostingsOptions} from '../query'

describe('jobPostingsOptions', () => {
	// Every Student Work screen reads the board, so a tap from the landing to a
	// list would refetch it without this.
	test('keeps the board fresh for five minutes', () => {
		expect(jobPostingsOptions.staleTime).toBe(5 * 60 * 1000)
	})
})
