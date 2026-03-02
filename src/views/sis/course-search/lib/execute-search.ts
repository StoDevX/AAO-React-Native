import type {CourseType as Course} from '../../../../lib/course-search'
import keywordSearch from 'keyword-search'
import {deptNum} from './format-dept-num'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'

export function applySearch(query: string, course: Course): boolean {
	let {name} = course
	if (keywordSearch(query, name.toLowerCase(), 1)) {
		return true
	}

	let {title = ''} = course
	if (keywordSearch(query, title.toLowerCase(), 1)) {
		return true
	}

	let {instructors = []} = course
	if (
		instructors.some((instructorName) =>
			keywordSearch(query, instructorName.toLowerCase(), 1),
		)
	) {
		return true
	}

	let lowerDeptnum = deptNum(course).toLowerCase()
	if (lowerDeptnum.startsWith(query)) {
		return true
	}

	let {gereqs = []} = course
	if (gereqs.some((gereq) => gereq.toLowerCase().startsWith(query))) {
		return true
	}

	return false
}

interface SortedAgainType {
	title: string
	data: Array<Course>
}

export function sortAndGroupResults(results: Array<Course>): SortedAgainType[] {
	let sorted: Array<Course> = sortBy(results, (course) => deptNum(course))
	let byTerm = groupBy(sorted, (r) => r.term)

	let forSectionList = toPairs(byTerm).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	let sortedAgain: SortedAgainType[] = sortBy(
		forSectionList,
		(course) => course.title,
	)

	sortedAgain.reverse()

	return sortedAgain
}
