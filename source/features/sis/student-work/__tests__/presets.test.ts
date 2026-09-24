import type {JobSummary} from '@frogpond/ccc-jobs'
import {postedTags, presetCounts, POSTED_NEW, POSTED_RECENT} from '../presets'

const TODAY = new Date(2026, 8, 5, 12)

function job(id: string, title: string, postedDate: string): JobSummary {
	return {id, title, postedDate, location: undefined}
}

describe('postedTags', () => {
	// "The last 30 days" is today and the 29 days before it.
	test('tags a posting from the last 30 days as recent', () => {
		expect(postedTags(job('a', 'X', '2026-09-05'), new Set(), TODAY)).toEqual([POSTED_RECENT])
		expect(postedTags(job('a', 'X', '2026-08-07'), new Set(), TODAY)).toEqual([POSTED_RECENT])
		expect(postedTags(job('a', 'X', '2026-08-06'), new Set(), TODAY)).toEqual([])
	})

	test('tags a posting the student has not seen as new', () => {
		expect(postedTags(job('a', 'X', '2026-01-01'), new Set(['a']), TODAY)).toEqual([POSTED_NEW])
	})
})

describe('presetCounts', () => {
	test('counts each preset from the board alone', () => {
		let jobs = [
			job('a', 'AY Mail Worker (WS-ST1)', '2026-09-01'),
			job('b', 'Summer Camp Counselor (WS-NST2)', '2026-07-01'),
			job('c', 'AY Lead Tutor (WS-ST3)', '2026-09-04'),
		]
		expect(presetCounts(jobs, new Set(['c']), TODAY)).toEqual({
			new: 1,
			recent: 2,
			entry: 1,
			summer: 1,
			all: 3,
		})
	})
})
