/**
 * @flow
 * loadStudentNumber fetches the student number from the SIS.
 */

import {NetInfo} from 'react-native'
import startsWith from 'lodash/startsWith'

import * as cache from '../cache'
import {parseHtml} from '../html'
import {COURSES_PAGE, LANDING_PAGE} from './urls'
import {parseStudentNumberFromDom} from './parse-student-number'

type PromisedDataType = Promise<{error: true, value: Error}|{error: false, value: number}>;

export async function loadStudentNumber({force}: {force: boolean}): PromisedDataType {
  const isConnected = await NetInfo.isConnected.fetch()
  const {isExpired, isCached, value} = await cache.getStudentNumber()

  if (isConnected && (isExpired || !isCached || force)) {
    const stnum = await fetchStudentNumberFromServer()

    // we don't want to cache error responses
    if (stnum.error) {
      return stnum
    }

    await cache.setStudentNumber(stnum.value)
    return stnum
  }

  return {error: false, value: value}
}


async function fetchStudentNumberFromServer(): PromisedDataType {
  const resp = await fetch(COURSES_PAGE)
  if (startsWith(resp.url, LANDING_PAGE)) {
    return {error: true, value: new Error('Authentication Error')}
  }

  const page = await resp.text()
  const dom = parseHtml(page)

  const stnum = parseStudentNumberFromDom(dom)
  if (stnum.length === 0) {
    return {error: true, value: new Error('no student number!')}
  }
  // TODO: present the choices to the user if len > 1

  return {error: false, value: stnum[0]}
}
