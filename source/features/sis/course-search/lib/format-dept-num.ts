import type {CourseType} from '../../../../lib/course-search'
export const deptNum = (course: Pick<CourseType, 'department' | 'number' | 'section'>): string =>
	`${course.department} ${course.number}${course.section ? course.section : ''}`
