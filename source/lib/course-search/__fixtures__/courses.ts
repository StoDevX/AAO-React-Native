import type {RawCourseType, TermInfoType} from '../types'

/**
 * One term and one course, for UI testing.
 *
 * The catalogue is several megabytes of live data that changes every
 * registration cycle, so a test searching it cannot say what it will find. This
 * is the smallest set that still reaches the detail screen: a term to search,
 * and a course in it to open.
 *
 * The course is built to exercise the detail screen's every section rather than
 * to be typical -- it has instructors, GEs, prerequisites, notes, a
 * description, and a lab that meets twice on one day so the schedule has a
 * grouped row to draw.
 */
export const UITEST_TERM = {
	hash: 'uitest',
	path: '2026-1.json',
	term: 20261,
	type: 'json',
	year: 2026,
} as const

export const UITEST_TERM_INFO: TermInfoType = {
	files: [UITEST_TERM],
	type: 'json',
}

/// Mirrored by `TestIdentifiers.CourseCatalog.aCourse`.
export const UITEST_COURSE_NAME = 'Hybrid Test Course'

export const UITEST_COURSES: RawCourseType[] = [
	{
		clbid: 170131,
		credits: 1,
		crsid: 1,
		department: 'CSCI',
		description: [
			'A course that exists only under UI testing, so the detail screen has every one of its sections to draw.',
		],
		enrolled: 12,
		gereqs: ['SED', 'WRI'],
		instructors: ['Ada Lovelace', 'Grace Hopper'],
		level: 200,
		max: 30,
		name: UITEST_COURSE_NAME,
		notes: ['Meets in the second half of the semester.'],
		number: 251,
		offerings: [
			{day: 'Mo', start: '9:00', end: '10:00', location: 'RNS 310'},
			{day: 'We', start: '9:00', end: '10:00', location: 'RNS 310'},
			// Twice on one Friday: the case the schedule has to group rather
			// than draw as two headings.
			{day: 'Fr', start: '9:00', end: '10:00', location: 'RNS 310'},
			{day: 'Fr', start: '13:00', end: '15:00', location: 'RNS 190'},
		],
		pn: true,
		prerequisites: 'CSCI 125 or consent of instructor',
		section: 'A',
		semester: 1,
		status: 'O',
		term: 20261,
		title: UITEST_COURSE_NAME,
		type: 'Research',
		year: 2026,
	},
]
