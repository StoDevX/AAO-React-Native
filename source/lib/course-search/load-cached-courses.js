// @flow

import type {CourseType, TermType} from './types'
import {loadTermsFromStorage} from './update-course-storage'
import {COURSE_STORAGE_DIR} from './urls'
import flatten from 'lodash/flatten'
import RNFS from 'react-native-fs'

export async function loadCachedCourses(): Promise<Array<CourseType>> {
	const terms: Array<TermType> = await loadTermsFromStorage()
	const promises = terms.map(term => loadTermCoursesFromStorage(term))
	const coursesByTerm = await Promise.all(promises)
	return flatten(coursesByTerm)
}

function loadTermCoursesFromStorage(
	term: TermType,
): Promise<Array<CourseType>> {
	return RNFS.readFile(COURSE_STORAGE_DIR + term.path).then(contents => {
		return JSON.parse(contents)
	})
}
