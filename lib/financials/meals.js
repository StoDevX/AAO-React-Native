// @flow
import {loadLoginCredentials} from '../login'
import buildFormData from '../formdata'
import {parseHtml, cssSelect} from '../html'
import {OLECARD_AUTH_URL} from './urls'
import type {MealsShapeType} from './types'
import * as cache from '../cache'

type MealOrErrorType = {error: true, value: Error}|{error: false, value: MealsShapeType};

export async function getMealsRemaining(isConnected: boolean, force?: boolean): Promise<MealOrErrorType> {
  const {isExpired, isCached, value} = await cache.getMealInfo()

  if (isConnected && (isExpired || !isCached || force)) {
    const termList = await fetchMealsRemainingFromServer()

    // we don't want to cache error responses
    if (termList.error) {
      return termList
    }

    await cache.setMealInfo(termList.value)
    return termList
  }

  if (!value) {
    return {error: false, value: {daily: null, weekly: null}}
  }

  return {error: false, value: value}
}

async function fetchMealsRemainingFromServer(): Promise<MealOrErrorType> {
  // TODO: come up with a better story around auth for olecard
  const {username, password} = await loadLoginCredentials()
  if (!username || !password) {
    throw new Error('not logged in!')
  }

  const form = buildFormData({
    username: username,
    password: password,
  })
  const result = await fetch(OLECARD_AUTH_URL, {method: 'POST', body: form})
  const page = result.text()
  const dom = parseHtml(page)

  return parseMealsRemainingFromDom(dom)
}

function parseMealsRemainingFromDom(dom: mixed): MealOrErrorType {
  const data = cssSelect('.accountrow', dom)
  const values = data.map(item => {
    return item.next.next.children[0].data
  })

  if (values.length < 4) {
    return {error: false, value: {weekly: null, daily: null}}
  }
  return {error: false, value: {weekly: values[4], daily: values[3]}}
}
