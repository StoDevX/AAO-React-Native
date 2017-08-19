/**
 * @flow
 * loadAllCourses is the entry point for loading courses from
 * the SIS.
 */

import type {CourseCollectionType} from './types'
import {loadStudentNumber} from './load-student-number'
import {loadCoursesFromUnofficialTranscript} from './load-courses-from-unofficial-transcript'

export async function loadAllCourses(
  isConnected: boolean,
  force?: boolean,
): Promise<CourseCollectionType> {
  // Get the student number – the SIS requires it on requests
  const stnumOrError = await loadStudentNumber({isConnected, force})
  if (stnumOrError.error) {
    return {error: true, value: stnumOrError.value}
  }
  const stnum = stnumOrError.value

  // Get the list of terms the student's taken courses in
  const coursesOrError = await loadCoursesFromUnofficialTranscript({
    stnum,
    isConnected,
    force,
  })
  if (coursesOrError.error) {
    return {error: true, value: coursesOrError.value}
  }
  return {error: false, value: coursesOrError.value}
}
