import type {CourseType} from '../../../../lib/course-search'
export const deptNum = (course: CourseType): string =>
	`${course.department} ${course.number}${course.section ? course.section : ''}`
