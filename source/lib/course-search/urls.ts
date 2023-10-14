import ky, {Options} from 'ky'
import {CourseType, RawCourseType, TermInfoType, TermType} from './types'
import intersection from 'lodash/intersection'

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
	levels: Array<CourseType['level']>,
	gereqs: string[] = [],
	options?: Options,
): Promise<Array<CourseType>> => {
	let data = (await client
		.get(`${term.path}`, options)
		.json()) as RawCourseType[]
	return data
		.map((course) => ({
			spaceAvailable: course.enrolled < course.max,
			...course,
		}))
		.filter((c) => {
			return findMatches(c.level, levels, c.gereqs, gereqs)
		}) as CourseType[]
}

const findMatches = (
	findLevel: number,
	levels: Array<number>,
	findgereqs: Array<string> = [],
	gereqs: Array<string>,
) => {
	let foundLevels = matchesLevels(findLevel, levels)
	let foundGEs = matchesGEs(findgereqs, gereqs)

	if (levels.length && gereqs.length) {
		return foundLevels && foundGEs
	} else if (levels.length) {
		return foundLevels
	} else if (gereqs.length) {
		return foundGEs
	}

	return true
}

const matchesLevels = (item: number, levels: Array<CourseType['level']>) => {
	let levelRoundedDown = Math.floor(item / 100) * 100
	return levels.includes(levelRoundedDown)
}

const matchesGEs = (items: string[] | undefined, gereqs: string[]) => {
	return items ? intersection(gereqs, items).length > 0 : false
}
