// @flow

import type {CourseType} from '../../../../lib/course-search'
export const deptNum = (course: CourseType) =>
	`${course.departments.join('/')} ${course.number}${
		course.section ? course.section : ''
	}`
