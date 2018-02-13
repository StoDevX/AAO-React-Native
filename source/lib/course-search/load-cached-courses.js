// @flow

import type {CourseType, TermType} from './types'
import flatten from 'lodash/flatten'
import * as storage from '../storage'

export async function loadCachedCourses(): Promise<Array<CourseType>> {
	const terms: Array<TermType> = await storage.getTermInfo()
	const promises = terms.map(term => storage.getTermCourseData(term.term))
	const coursesByTerm = await Promise.all(promises)
	return flatten(coursesByTerm)
}
