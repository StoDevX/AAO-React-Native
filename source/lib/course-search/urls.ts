import ky, {Options} from 'ky'
import {CourseType, RawCourseType, TermInfoType, TermType} from './types'

const BASE_URL = 'https://stolaf.dev'
export const COURSE_DATA_PAGE = `${BASE_URL}/course-data/`
export const INFO_PAGE = `${BASE_URL}/course-data/info.json`
export const GE_DATA = `${BASE_URL}/course-data/data-lists/valid_gereqs.json`
export const DEPT_DATA = `${BASE_URL}/course-data/data-lists/valid_departments.json`
export const TIMES_DATA = `${BASE_URL}/course-data/data-lists/valid_times.json`

export let client = ky.create({prefixUrl: COURSE_DATA_PAGE})
export let infoJson = (options?: Options): Promise<TermInfoType> =>
	client.get('info.json', options).json()
export let geData = (options?: Options): Promise<string[]> =>
	client.get('data-lists/valid_gereqs.json', options).json()
export let deptData = (options?: Options): Promise<string[]> =>
	client.get('data-lists/valid_departments.json', options).json()
export let timeData = (options?: Options): Promise<string[]> =>
	client.get('data-lists/valid_times.json', options).json()
export let coursesForTerm = async (
	term: TermType,
	options?: Options,
): Promise<Array<CourseType>> => {
	let data = (await client
		.get(`${term.path}`, options)
		.json()) as RawCourseType[]
	return data.map((course) => ({
		spaceAvailable: course.enrolled < course.max,
		...course,
	})) as CourseType[]
}
