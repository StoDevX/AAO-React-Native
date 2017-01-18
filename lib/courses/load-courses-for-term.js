/**
 * @flow
 * loadCoursesForTerm fetches the courses for a given term.
 */

import startsWith from 'lodash/startsWith'

import * as cache from '../cache'
import buildFormData from '../formdata'
import {parseHtml} from '../html'
import {COURSES_PAGE, LANDING_PAGE} from './urls'
import {parseCoursesFromDom} from './parse-courses'
import type {CourseType} from './types'

type PromisedDataType = Promise<{error: true, value: Error}|{error: false, value: CourseType[]}>;

export async function loadCoursesForTerm({term, stnum, force, isConnected}: {
  term: number,
  stnum: number,
  isConnected: boolean,
  force?: boolean,
}): PromisedDataType {
  const {isExpired, isCached, value} = await cache.getCoursesForTerm(term)

  if (isConnected && (isExpired || !isCached || force)) {
    const courses = await fetchCoursesForTermFromServer({term, stnum})

    // we don't want to cache error responses
    if (courses.error) {
      return courses
    }

    await cache.setCoursesForTerm(term, courses.value)
    return courses
  }

  return {error: false, value}
}


async function fetchCoursesForTermFromServer({term, stnum}: {
  term: number,
  stnum: number,
}): PromisedDataType {
  const form = buildFormData({stnum: String(stnum), searchyearterm: String(term)})
  const resp = await fetch(COURSES_PAGE, {method: 'POST', body: form})
  if (startsWith(resp.url, LANDING_PAGE)) {
    return {error: true, value: new Error('Authentication Error')}
  }

  const page = await resp.text()
  const dom = parseHtml(page)

  const courses = parseCoursesFromDom(dom, term)

  return {error: false, value: courses}
}
