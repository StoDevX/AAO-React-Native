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
 * each rule reads a word in one rather than a whole title. A rule's place also orders the people
 * of its group: an executive editor comes before a manager or director. Copy Editor is read before
 * any other Editor, since copy editors are not section editors.
 */
const RULES: Array<{pattern: RegExp; group: GroupTitle}> = [
	{pattern: /\bExecutive Editor\b/iu, group: 'Leadership'},
	{pattern: /\bCopy Editor\b/iu, group: 'Copy Desk'},
	{pattern: /\b(?:Manager|Director)\b/iu, group: 'Leadership'},
	{pattern: /\bEditor\b/iu, group: 'Section Editors'},
	{pattern: /\b(?:Writer|Reporter|Correspondent)\b/iu, group: 'Writers'},
	{pattern: /\b(?:Photographer|Illustrator)\b/iu, group: 'Visuals'},
]

/** The index of the rule a role matches; a role matching none ranks after every rule. */
function ruleOf(role: string): number {
	let index = RULES.findIndex((rule) => rule.pattern.test(role))
	return index === -1 ? RULES.length : index
}

/**
 * A year's staff in groups, as a masthead lists them: leadership, section editors, writers,
 * visuals and the copy desk, then anyone whose role none of them names. Within a group, people
 * are ordered by their rule, then their role, then their name. An empty group is left out.
 */
export function groupStaff(profiles: StaffProfile[]): StaffGroup[] {
	let sorted = [...profiles].sort(
		(a, b) =>
			ruleOf(a.role) - ruleOf(b.role) ||
			a.role.localeCompare(b.role) ||
			a.name.localeCompare(b.name),
	)
	return GROUPS.map((title) => ({
		title,
		people: sorted.filter((p) => (RULES[ruleOf(p.role)]?.group ?? 'Other Staff') === title),
	})).filter((group) => group.people.length > 0)
}

const YearsSchema = z.array(z.object({id: z.number(), name: z.string()}))

/** The newest of the paper's staff years. Years read `2026-2027`, so they sort as text. */
export function newestStaffYear(body: unknown): {id: number; name: string} {
	let [newest] = YearsSchema.parse(body).sort((a, b) => b.name.localeCompare(a.name))
	if (!newest) throw new Error('The Olaf Messenger lists no staff years')
	return newest
}

/**
 * A staff member as the college directory's tile and photo draw a person: their picture, or their
 * initials, from the first and last words of their name, when the paper has none.
 */
export function photoSubjectOf(person: StaffProfile): PersonPhotoSubject {
	let words = person.name.split(/\s+/u)
	return {
		displayName: person.name,
		firstName: words[0] ?? '',
		lastName: words.length > 1 ? (words.at(-1) ?? '') : '',
		thumbnail: person.photo?.url ?? '',
	}
}
