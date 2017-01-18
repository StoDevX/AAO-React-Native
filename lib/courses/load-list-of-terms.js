/**
 * @flow
 * loadListOfTerms fetches the terms for which the student has had courses.
 */

import startsWith from 'lodash/startsWith'

import * as cache from '../cache'
import buildFormData from '../formdata'
import {parseHtml} from '../html'
import {COURSES_PAGE, LANDING_PAGE} from './urls'
import {parseListOfTermsFromDom} from './parse-list-of-terms'

type PromisedDataType = Promise<{error: true, value: Error}|{error: false, value: number[]}>;

export async function loadListOfTerms({stnum, force, isConnected}: {
  stnum: number,
  isConnected: boolean,
  force?: boolean,
}): PromisedDataType {
  const {isExpired, isCached, value} = await cache.getListOfTerms()

  if (isConnected && (isExpired || !isCached || force)) {
    const termList = await fetchListOfTermsFromServer(stnum)

    // we don't want to cache error responses
    if (termList.error) {
      return termList
    }

    await cache.setListOfTerms(termList.value)
    return termList
  }

  return {error: false, value: value}
}


async function fetchListOfTermsFromServer(stnum: number): PromisedDataType {
  const form = buildFormData({stnum: String(stnum)})
  const resp = await fetch(COURSES_PAGE, {method: 'POST', body: form})
  if (startsWith(resp.url, LANDING_PAGE)) {
    return {error: true, value: new Error('Authentication Error')}
  }

  const page = await resp.text()
  const dom = parseHtml(page)

  const terms = parseListOfTermsFromDom(dom)

  return {error: false, value: terms}
}
