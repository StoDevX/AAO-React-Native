import type {RawCourseType} from '../types'

/// Mirrored by `TestIdentifiers.CourseCatalog.aCourse`.
export const UITEST_COURSE_NAME = 'Introduction to Glaciology'

/**
 * One Wiki Monkeys course, for UI testing, written into the catalog UI tests search.
 *
 * The catalogue is several megabytes of live data that changes every
 * registration cycle, so a test searching it cannot say what it will find. This
 * is the smallest set that still reaches the detail screen: a course to search
 * for and open.
 *
 * The course is built to exercise the detail screen's every section rather than
 * to be typical -- it has instructors, GEs, prerequisites, notes, a
 * description, and a lab that meets twice on one day so the schedule has a
 * grouped row to draw.
 */
export const UITEST_COURSES: RawCourseType[] = [
	{
		clbid: 170131,
		credits: 1,
		crsid: 1,
		department: 'GLAC',
		description: [
			'How ice forms, flows and remembers, from the snowfield above campus to the ice sheets, with a lab on the glacier itself.',
		],
		enrolled: 12,
		gereqs: ['SED', 'WRI'],
		instructors: ['Ada Lovelace', 'Grace Hopper'],
		level: 100,
		max: 30,
		name: UITEST_COURSE_NAME,
		notes: ['The Friday afternoon lab meets at the trailhead behind Glacier Hall.'],
		number: 151,
		offerings: [
			{day: 'Mo', start: '9:00', end: '10:00', location: 'Glacier Hall 310'},
			{day: 'We', start: '9:00', end: '10:00', location: 'Glacier Hall 310'},
			// Twice on one Friday: the case the schedule has to group rather
			// than draw as two headings.
			{day: 'Fr', start: '9:00', end: '10:00', location: 'Glacier Hall 310'},
			{day: 'Fr', start: '13:00', end: '15:00', location: 'Glacier Hall 190'},
		],
		pn: true,
		prerequisites: 'GLAC 110 or consent of instructor',
		section: 'A',
		semester: 1,
		status: 'O',
		term: 20261,
		title: UITEST_COURSE_NAME,
		type: 'Research',
		year: 2026,
	},
]
