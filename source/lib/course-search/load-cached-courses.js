// @flow

import type {CourseType, TermType} from './types'
import {loadTermsFromStorage} from './update-course-storage'
import {COURSE_STORAGE_DIR} from './urls'
import RNFS from 'react-native-fs'


export async function loadCachedCourses(): Array<CourseType> {
  const terms : Array<TermType> = await loadTermsFromStorage()
  let courses : Array<CourseType> = []

  for (i=0; i < terms.length; i++) {
    let newCourses : Array<CourseType>  = await loadTermCoursesFromStorage(terms[i])
    courses.push(...newCourses)
  }
  // console.log(courses)
  return courses
}

async function loadTermCoursesFromStorage(term: TermType): Array<CourseType> {
  return (
    RNFS.readFile(COURSE_STORAGE_DIR + term.path)
      .then((contents) => {
        return JSON.parse(contents)
      })
  )
}
