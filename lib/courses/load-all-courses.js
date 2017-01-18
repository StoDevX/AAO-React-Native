/**
 * @flow
 * loadAllCourses is the entry point for loading courses from
 * the SIS.
 */

import zipObject from 'lodash/zipObject'

import type {CourseCollectionType} from './types'
import {loadStudentNumber} from './load-student-number'
import {loadListOfTerms} from './load-list-of-terms'
import {loadCoursesForTerm} from './load-courses-for-term'

export async function loadAllCourses(force: boolean): Promise<CourseCollectionType> {
  // Get the student number – the SIS requires it on requests
  const stnumOrError = await loadStudentNumber({force})
  if (stnumOrError.error) {
    return {error: true, value: stnumOrError.value}
  }
  const stnum = stnumOrError.value

  // Get the list of terms the student's taken courses in
  const termsOrError = await loadListOfTerms({stnum, force})
  if (termsOrError.error) {
    return {error: true, value: termsOrError.value}
  }
  const terms = termsOrError.value

  // Get the courses for each term
  const courseLists = await Promise.all(terms.map(term =>
    loadCoursesForTerm({term, stnum, force})))

  // Group the terms and courses together
  // [[a, 1], [b, 2]] => {a: 1, b: 2}
  return {error: false, value: zipObject(terms, courseLists)}
}
