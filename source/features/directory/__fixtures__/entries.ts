import type {DirectoryItem, SearchResults} from '../types'

/**
 * One directory entry, for UI testing.
 *
 * The live directory is whoever works at St. Olaf this week, which is nothing
 * to assert against: a test naming a real person breaks when they leave, and
 * the desk that was named instead to avoid that carries almost no fields, so
 * the screen it draws is mostly empty.
 *
 * This entry carries every field the detail screen draws -- pronouns, email,
 * office hours with a link, a profile, a room with a phone, and more than one
 * department -- so a section that stops rendering shows up rather than looking
 * like an entry that happened to lack it.
 */

/// Mirrored by `TestIdentifiers.Directory.fixtureEntry`.
export const UITEST_ENTRY_NAME = 'Kari Testerson'
export const UITEST_ENTRY_DEPARTMENT = 'Computer Science'

const ENTRY: DirectoryItem = {
	campusLocations: [
		{
			display: 'Regents Hall 310',
			buildingabbr: 'RNS',
			building: 'Regents Hall of Natural Sciences',
			phone: '507-786-3000',
			room: 310,
			shortLocation: 'RNS 310',
		},
	],
	classYear: null,
	departments: [
		{href: 'https://wp.stolaf.edu/cs/', name: UITEST_ENTRY_DEPARTMENT},
		{href: 'https://wp.stolaf.edu/mathematics/', name: 'Mathematics'},
	],
	displayName: UITEST_ENTRY_NAME,
	displayTitle: 'Associate Professor of Computer Science and Mathematics',
	email: 'testerson@stolaf.edu',
	firstName: 'Kari',
	homeAddress: {zip: '', city: '', country: '', state: '', street: []},
	homePhone: null,
	lastName: 'Testerson',
	officeHours: {
		display: 'M-W-F 10:00 a.m. to noon',
		prefix: 'Office Hours',
		hrefLabel: 'Book a time',
		href: 'https://wp.stolaf.edu/cs/office-hours/',
		content: 'M-W-F 10:00 a.m. to noon',
		description: 'M-W-F 10:00 a.m. to noon',
		title: 'Office Hours',
	},
	onLeave: null,
	photo: '',
	profileUrl: 'https://wp.stolaf.edu/profile/testerson',
	pronouns: ['she', 'her', 'hers'],
	suffixName: null,
	thumbnail: '',
	title: 'Associate Professor',
	username: 'testerson',
	description: null,
}

export const UITEST_DIRECTORY_RESULTS: SearchResults = {
	meta: {count: 1, fullCount: 1},
	results: [ENTRY],
}
