import type {CourseType} from '../../lib/course-search/types.ts'
import {LIST_SEPARATOR} from './queries.ts'

/** A row of `courseResultsQuery`. */
export type CourseListRow = {
	clbid: number
	term: number
	department: string
	number: number
	section: string | null
	status: string
	name: string | null
	title: string | null
	notes: string | null
	gereqs: string | null
	instructors: string | null
}

/** What a course search list row draws. */
export type CourseListItem = Pick<
	CourseType,
	| 'term'
	| 'clbid'
	| 'name'
	| 'title'
	| 'department'
	| 'number'
	| 'section'
	| 'status'
	| 'gereqs'
	| 'instructors'
	| 'notes'
>

/** A row of `courseQuery`: `section_full`. */
export type CourseRow = {
	clbid: number
	crsid: number
	term: number
	year: number
	semester: number
	department: string
	number: string
	section: string | null
	level: number
	type: string
	name: string | null
	title: string | null
	description: string | null
	credits: number | null
	pass_nopass: number
	status: string
	enrolled: number
	enrollment_max: number | null
	notes: string | null
	prerequisites: string | null
}

/** The rows of `courseChildrenQueries`, by key. */
export type CourseChildren = {
	gereqs: Array<{code: string}>
	instructors: Array<{name: string}>
	offerings: Array<{day: string; start: string; end: string; location: string}>
}

function nonEmpty<T>(items: T[]): T[] | undefined {
	return items.length > 0 ? items : undefined
}

/** A stored list or set of paragraphs, split; undefined for none, as the catalog leaves an empty one out. */
function split(joined: string | null, separator: string): string[] | undefined {
	return joined ? joined.split(separator) : undefined
}

export function listItem(row: CourseListRow): CourseListItem {
	return {
		clbid: row.clbid,
		term: row.term,
		department: row.department,
		number: row.number,
		section: row.section ?? undefined,
		status: row.status,
		name: row.name ?? '',
		title: row.title ?? undefined,
		notes: split(row.notes, '\n'),
		gereqs: split(row.gereqs, LIST_SEPARATOR),
		instructors: split(row.instructors, LIST_SEPARATOR),
	}
}

/** `items` in sections by term, in the order they came, titled with the term number. */
export function sectionsByTerm(
	items: CourseListItem[],
): Array<{title: string; data: CourseListItem[]}> {
	let sections: Array<{title: string; data: CourseListItem[]}> = []
	for (let item of items) {
		let last = sections.at(-1)
		if (last && last.title === String(item.term)) last.data.push(item)
		else sections.push({title: String(item.term), data: [item]})
	}
	return sections
}

/** A whole course from its `section_full` row and its lists. */
export function hydrateCourse(row: CourseRow, children: CourseChildren): CourseType {
	let max = row.enrollment_max
	return {
		clbid: row.clbid,
		credits: row.credits ?? 0,
		crsid: row.crsid,
		department: row.department,
		description: split(row.description, '\n'),
		enrolled: row.enrolled,
		gereqs: nonEmpty(children.gereqs.map((child) => child.code)),
		instructors: nonEmpty(children.instructors.map((child) => child.name)),
		level: row.level,
		max: max ?? 0,
		name: row.name ?? '',
		notes: split(row.notes, '\n'),
		number: Number(row.number),
		offerings: children.offerings,
		pn: row.pass_nopass === 1,
		prerequisites: row.prerequisites ?? false,
		section: row.section ?? undefined,
		semester: row.semester,
		spaceAvailable: max !== null && row.enrolled < max,
		status: row.status,
		term: row.term,
		title: row.title ?? undefined,
		type: row.type,
		year: row.year,
	}
}
