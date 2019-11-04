// @flow

import type {CourseType, TermType} from './types'
import flatten from 'lodash/flatten'
import * as storage from '../storage'

export async function loadCachedCourses(): Promise<Array<CourseType>> {
	let terms: Array<TermType> = await storage.getTermInfo()
	let promises = terms.map(term => storage.getTermCourseData(term.term))
	let coursesByTerm = await Promise.all(promises)
	return flatten(coursesByTerm)
}
