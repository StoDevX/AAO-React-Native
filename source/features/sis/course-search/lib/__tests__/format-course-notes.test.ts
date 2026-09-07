import {describe, expect, test} from '@jest/globals'
import {formatCourseNotes} from '../format-course-notes'

describe('formatCourseNotes', () => {
	test('collapses runs of whitespace inside a note', () => {
		expect(
			formatCourseNotes([
				'Prerequisite: CSCI 251.                Not open to first-year students.',
			]),
		).toBe('Prerequisite: CSCI 251. Not open to first-year students.')
	})

	test('joins multiple notes with a single space', () => {
		expect(formatCourseNotes(['Prerequisite: CSCI 251.', 'Not open to first-year students.'])).toBe(
			'Prerequisite: CSCI 251. Not open to first-year students.',
		)
	})

	test('trims leading and trailing whitespace', () => {
		expect(formatCourseNotes(['  Meets in Regents Hall.  '])).toBe('Meets in Regents Hall.')
	})

	test('normalises tabs and newlines to single spaces', () => {
		expect(formatCourseNotes(['Lab section\trequired.\n\nSee instructor.'])).toBe(
			'Lab section required. See instructor.',
		)
	})
})
