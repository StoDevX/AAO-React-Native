/**
 * @flow
 * loadCoursesForTerm fetches the courses for a given term.
 */

import startsWith from 'lodash/startsWith'

import * as cache from '../cache'
import buildFormData from '../formdata'
import {parseHtml} from '../html'
import {GRADES_PAGE, LANDING_PAGE} from './urls'
import {parseCoursesFromDom} from './parse-courses'
import type {CourseCollectionType} from './types'

type PromisedDataType = Promise<CourseCollectionType>

export async function loadCoursesFromUnofficialTranscript({
  stnum,
  force,
  isConnected,
}: {
  stnum: number,
  isConnected: boolean,
  force?: boolean,
}): PromisedDataType {
  const {isExpired, isCached, value} = await cache.getAllCourses()

  if (isConnected && (isExpired || !isCached || force)) {
    const courses = await fetchAllCoursesFromServer({stnum})

    // we don't want to cache error responses
    if (courses.error) {
      return courses
    }

    await cache.setAllCourses(courses.value)
    return courses
  }

  return {error: false, value: value || {}}
}

async function fetchAllCoursesFromServer({
  stnum,
}: {
  stnum: number,
}): PromisedDataType {
  const form = buildFormData({stnum: String(stnum), searchyearterm: '0'})
  const resp = await fetch(GRADES_PAGE, {method: 'POST', body: form})
  if (startsWith(resp.url, LANDING_PAGE)) {
    return {error: true, value: new Error('Authentication Error')}
  }

  const page = await resp.text()
  // console.log(page)
  const dom = parseHtml(page)

  const courses = parseCoursesFromDom(dom)

  return {error: false, value: courses}
}
