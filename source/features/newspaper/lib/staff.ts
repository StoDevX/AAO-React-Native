import {z} from 'zod'
import type {PersonPhotoSubject} from '../../directory/person-photo'
import type {StaffProfile} from '../types'

/** A group of the staff directory, such as `Writers`, and the people in it. */
export type StaffGroup = {title: string; people: StaffProfile[]}

/** The directory's groups, in the order a masthead lists them. */
const GROUPS = [
	'Leadership',
	'Section Editors',
	'Writers',
	'Visuals',
	'Copy Desk',
	'Other Staff',
] as const

type GroupTitle = (typeof GROUPS)[number]

/**
 * Which group a role belongs to, by the first rule it matches. The paper sets its own titles, so
 * each rule reads a word in one, singular or plural, rather than a whole title, and a new title of
 * a known kind still finds its group. A rule's place also orders the people of its group: the
 * editor in chief comes first, then executive and managing editors, then managers and directors.
 * Copy titles are read before any other Editor, since copy editors are not section editors, and
 * the paper's top editors before both.
 */
const RULES: Array<{pattern: RegExp; group: GroupTitle}> = [
	{pattern: /\bEditors?[- ]in[- ]Chief\b/iu, group: 'Leadership'},
	{pattern: /\bExecutive Editors?\b/iu, group: 'Leadership'},
	{pattern: /\bManaging Editors?\b/iu, group: 'Leadership'},
	{pattern: /\bCopy\b/iu, group: 'Copy Desk'},
	{pattern: /\b(?:Manager|Director)s?\b/iu, group: 'Leadership'},
	{pattern: /\bEditors?\b/iu, group: 'Section Editors'},
	{pattern: /\b(?:Writer|Reporter|Correspondent)s?\b/iu, group: 'Writers'},
	{pattern: /\b(?:Photographer|Illustrator)s?\b/iu, group: 'Visuals'},
]

/** A title that assists another, as an Assistant Managing Editor does a Managing Editor. */
const ASSISTING = /^(?:Assistant|Associate|Deputy)\b/iu

/**
 * A year's staff in groups, as a masthead lists them: leadership, section editors, writers,
 * visuals and the copy desk, then anyone whose role none of them names. Within a group, people
 * are ordered by their rule, then with anyone assisting after those they assist, then by their
 * role and their name. An empty group is left out.
 */
export function groupStaff(profiles: StaffProfile[]): StaffGroup[] {
	// Each role is matched once; a role matching no rule ranks after every rule.
	let ranked = profiles.map((person) => {
		let rule = RULES.findIndex((r) => r.pattern.test(person.role))
		return {
			person,
			rule: rule === -1 ? RULES.length : rule,
			assisting: ASSISTING.test(person.role) ? 1 : 0,
		}
	})
	ranked.sort(
		(a, b) =>
			a.rule - b.rule ||
			a.assisting - b.assisting ||
			a.person.role.localeCompare(b.person.role) ||
			a.person.name.localeCompare(b.person.name),
	)
	return GROUPS.map((title) => ({
		title,
		people: ranked
			.filter(({rule}) => (RULES[rule]?.group ?? 'Other Staff') === title)
			.map(({person}) => person),
	})).filter((group) => group.people.length > 0)
}

const YearsSchema = z.array(z.object({id: z.number(), name: z.string()}))

/** A staff year's name, such as `2026-2027`. */
const YEAR_NAME = /^\d{4}-\d{4}$/u

/**
 * The newest of the paper's staff years, or none when it lists none. Years read `2026-2027`, so
 * they sort as text; a term named otherwise, such as `Alumni`, is no year and would sort after
 * every one, so it is passed over.
 */
export function newestStaffYear(body: unknown): {id: number; name: string} | null {
	let [newest] = YearsSchema.parse(body)
		.filter((year) => YEAR_NAME.test(year.name))
		.sort((a, b) => b.name.localeCompare(a.name))
	return newest ?? null
}

/** A suffix after a name, such as `Jr.` or `III`. */
const NAME_SUFFIX = /^(?:Jr|Sr)\.?$|^(?:II|III|IV)$/u

/**
 * A staff member as the college directory's tile and photo draw a person: their picture, or their
 * initials, from the first and last words of their name, when the paper has none.
 */
export function photoSubjectOf(person: StaffProfile): PersonPhotoSubject {
	let words = person.name.split(/\s+/u).filter((word) => word !== '')
	// A suffix is no last name: Sam Ruiz Jr. is SR.
	let named = words.length > 2 && NAME_SUFFIX.test(words.at(-1) ?? '') ? words.slice(0, -1) : words
	return {
		displayName: person.name,
		firstName: named[0] ?? '',
		lastName: named.length > 1 ? (named.at(-1) ?? '') : '',
		thumbnail: person.photo?.url ?? '',
	}
}
