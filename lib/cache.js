// @flow
import {AsyncStorage} from 'react-native'
import moment from 'moment'

import type {CoursesByTermType} from './courses/types'

type BaseCacheResultType<T> = {
  isExpired: boolean,
  isCached: boolean,
  value: ?T,
};

type CacheResultType<T> = Promise<BaseCacheResultType<T>>;

function needsUpdate(time: Date, [count, unit]: [number, string]): boolean {
  return moment(time).isBefore(moment().subtract(count, unit))
}

function annotateCacheEntry(stored) {
  // if nothing's stored, note that it's expired and not cached
  if (stored === null || stored === undefined) {
    return {isCached: false, isExpired: true, value: null}
  }

  // migration from old storage
  if (!('dateCached' in stored && 'timeToCache' in stored && 'value' in stored)) {
    return {isCached: true, isExpired: true, value: stored}
  }

  // handle AsyncStorage entries that aren't caches, like the homescreen order
  if (!stored.timeToCache) {
    return {isCached: true, isExpired: false, value: stored.value}
  }

  const date = new Date(stored.dateCached)
  const isExpired = needsUpdate(date, stored.timeToCache)
  return {isCached: true, isExpired, value: stored.value}
}


/// MARK: Utilities

function setItem(key: string, value: any, cacheTime?: [number, string]) {
  const dataToStore = {
    dateCached: new Date().toUTCString(),
    timeToCache: cacheTime,
    value: value,
  }
  return AsyncStorage.setItem(`aao:${key}`, JSON.stringify(dataToStore))
}
function getItem(key: string): CacheResultType<any> {
  return AsyncStorage.getItem(`aao:${key}`)
    .then(stored => annotateCacheEntry(JSON.parse(stored)))
}


/// MARK: courses

const studentNumberKey = 'courses:student-number'
const studentNumberCacheTime = [1, 'week']
export function setStudentNumber(idNumbers: number) {
  return setItem(studentNumberKey, idNumbers, studentNumberCacheTime)
}
export function getStudentNumber(): CacheResultType<number> {
  return getItem(studentNumberKey)
}

const coursesKey = 'courses'
const coursesCacheTime = [1, 'hour']
export function setAllCourses(courses: CoursesByTermType) {
  return setItem(coursesKey, courses, coursesCacheTime)
}
export function getAllCourses(): CacheResultType<?CoursesByTermType> {
  return getItem(coursesKey)
}


/// MARK: Financials

const flexBalanceKey = 'financials:flex'
const flexBalanceCacheTime = [5, 'minutes']
export function setFlexBalance(balance: ?number) {
  return setItem(flexBalanceKey, balance, flexBalanceCacheTime)
}
export function getFlexBalance(): CacheResultType<?number> {
  return getItem(flexBalanceKey)
}

const oleBalanceKey = 'financials:ole'
const oleBalanceCacheTime = [5, 'minutes']
export function setOleBalance(balance: ?number) {
  return setItem(oleBalanceKey, balance, oleBalanceCacheTime)
}
export function getOleBalance(): CacheResultType<?number> {
  return getItem(oleBalanceKey)
}

const printBalanceKey = 'financials:print'
const printBalanceCacheTime = [5, 'minutes']
export function setPrintBalance(balance: ?number) {
  return setItem(printBalanceKey, balance, printBalanceCacheTime)
}
export function getPrintBalance(): CacheResultType<?number> {
  return getItem(printBalanceKey)
}


/// MARK: Meals

const mealsKey = 'meals'
const mealsCacheTime = [5, 'minutes']
export function setMealInfo(meals: {weekly: ?string, daily: ?string}) {
  return setItem(mealsKey, meals, mealsCacheTime)
}
export function getMealInfo(): CacheResultType<{weekly: ?string, daily: ?string}> {
  return getItem(mealsKey)
}
