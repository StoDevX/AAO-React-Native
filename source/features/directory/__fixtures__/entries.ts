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

/// A 40x52 gradient, at the photo's own aspect. Inline so it cannot fail for
/// want of a network, and visible rather than blank: a photo that drew nothing
/// would look exactly like one that failed to load.
const PHOTO =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAA0CAIAAAB3iO3aAAAA6klEQVR4nMXCBVICAAAAwXu7PQqoSHd3dysqqGM+yWfcznISiCk5DcaVnIUSSs5vk0ou7lJKLu/TSq7CGSXXkZySm2heSSBWUBKMF5WEEiUlt8mykvt0VUk4U1PykK0rieQaSqL5ppJYoaUkXmwrSZa7SlKVnpJ0ta8kUxsoydaHSnKNkZJCa6Kk2J4qKXVmSsrduZJKb6Gk2l8qqQ1WShqjjZLmeKukNdkpaU8flXRmT0q6872S/vJFyWD1qmS4PigZbY5Kxts3JZPdu5Lp44eS+f5TyeL5S8ny5VvJ6vVHyfrwq2Rz/FP+A/OrF2HR73bXAAAAAElFTkSuQmCC'

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
	photo: PHOTO,
	profileUrl: 'https://wp.stolaf.edu/profile/testerson',
	pronouns: ['she', 'her', 'hers'],
	suffixName: null,
	thumbnail: PHOTO,
	title: 'Associate Professor',
	username: 'testerson',
	description: null,
}

export const UITEST_DIRECTORY_RESULTS: SearchResults = {
	meta: {count: 1, fullCount: 1},
	results: [ENTRY],
}
