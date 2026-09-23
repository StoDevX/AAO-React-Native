import type {JobCategory, JobDetail} from '../types'

/**
 * Job postings for UI testing.
 *
 * The live board is whatever St. Olaf is hiring for this week, which is
 * nothing to assert against: a test naming a posting breaks when it closes.
 *
 * Two postings, because the detail screen's layout depends on its fields.
 * The first has a field long enough to wrap onto a second line, which is the
 * shape that once let the fields' form scroll on its own inside the page; the
 * second has only short fields.
 */

/// Mirrored by `TestIdentifiers.SIS.fixtureJobWithWrappingField`.
export const UITEST_WRAPPING_JOB_TITLE = 'Undergraduate Research Assistant'
/// Mirrored by `TestIdentifiers.SIS.fixtureJobWithShortFields`.
export const UITEST_SHORT_JOB_TITLE = 'Library Circulation Desk Assistant'

const SITE = 'https://jobs.example.invalid/sites/CX_1'

const BODY = [
	'**Description of the Position:** Students work with a faculty mentor on a scholarly or artistic project, from the first reading to a public presentation.',
	'**Transferable Skills:** Research, writing, and presenting to an audience.',
	'**Duties and Responsibilities:** Each project sets its own hours per week and number of weeks. See the [project database](https://example.invalid/projects) for individual project descriptions.',
	'**Qualifications:** Enrolled as an on-campus student. There is no grade requirement, but a student’s academic record is considered during selection. Skills depend on the individual project.',
	'Applicants without a work award who answer No to the application questions are rejected automatically; contact the program office to resolve this.',
	'**This job description is for general information purposes. It is not intended to list all duties and responsibilities of the position, and it may change at any time without notice.**',
].join('\n\n')

const WRAPPING_JOB: JobDetail = {
	id: 'uitest-1',
	title: UITEST_WRAPPING_JOB_TITLE,
	category: 'Student Work',
	schedule: 'Part time',
	location: 'Northfield, MN, United States',
	postedDate: '2026-09-10T17:20:22+00:00',
	fields: [
		{label: 'Classification', value: 'Student Employee (non-exempt)'},
		{label: 'Department', value: 'Research'},
		{label: 'Length', value: 'See Employment Authorization'},
		// Too long for one line beside its label, as the live board's research
		// postings have.
		{label: 'Contact', value: 'Faculty advisor listed in the research project database'},
		{label: 'Wage', value: '$13.50-15.50/hour'},
	],
	body: BODY,
	url: `${SITE}/job/uitest-1`,
}

const SHORT_JOB: JobDetail = {
	id: 'uitest-2',
	title: UITEST_SHORT_JOB_TITLE,
	category: 'Student Work',
	schedule: 'Part time',
	location: 'Northfield, MN, United States',
	postedDate: '2026-09-08T15:00:00+00:00',
	fields: [
		{label: 'Classification', value: 'Student Employee (non-exempt)'},
		{label: 'Department', value: 'Libraries'},
		{label: 'Wage', value: '$12.50/hour'},
	],
	body: BODY,
	url: `${SITE}/job/uitest-2`,
}

export const UITEST_JOB_DETAILS: JobDetail[] = [WRAPPING_JOB, SHORT_JOB]

export const UITEST_JOB_CATEGORIES: JobCategory[] = [
	{
		id: 1,
		name: 'Student Work',
		count: UITEST_JOB_DETAILS.length,
		jobs: UITEST_JOB_DETAILS.map((job) => ({
			id: job.id,
			title: job.title,
			postedDate: job.postedDate ?? '',
			location: job.location,
		})),
	},
]
