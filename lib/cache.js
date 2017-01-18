// @flow
import {AsyncStorage} from 'react-native'
import moment from 'moment'

import type {CourseType} from './courses/types'

type BaseCacheResultType<T> = {
  isExpired: boolean,
  isCached: boolean,
  value: T,
};

type CacheResultType<T> = Promise<BaseCacheResultType<T>>;

export function needsUpdate(time: Date, [count, unit]: [number, string]): boolean {
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

const listOfTermsKey = 'courses:term-list'
const listOfTermsCacheTime = [1, 'hour']
export function setListOfTerms(terms: number[]) {
  return setItem(listOfTermsKey, terms, listOfTermsCacheTime)
}
export function getListOfTerms(): CacheResultType<number[]> {
  return getItem(listOfTermsKey)
}

const coursesForTermKey = 'courses'
const coursesForTermCacheTime = [1, 'hour']
export function setCoursesForTerm(term: number, courses: CourseType[]) {
  return setItem(`${coursesForTermKey}:${term}`, courses, coursesForTermCacheTime)
}
export function getCoursesForTerm(term: number): CacheResultType<CourseType[]> {
  return getItem(`${coursesForTermKey}:${term}`)
}


/// MARK: Financials

const flexBalanceKey = 'financials:flex'
const flexBalanceCacheTime = [5, 'minutes']
export function setFlexBalance(balance: number|null) {
  return setItem(flexBalanceKey, balance, flexBalanceCacheTime)
}
export function getFlexBalance(): CacheResultType<number|null> {
  return getItem(flexBalanceKey)
}

const oleBalanceKey = 'financials:ole'
const oleBalanceCacheTime = [5, 'minutes']
export function setOleBalance(balance: number|null) {
  return setItem(oleBalanceKey, balance, oleBalanceCacheTime)
}
export function getOleBalance(): CacheResultType<number|null> {
  return getItem(oleBalanceKey)
}

const printBalanceKey = 'financials:print'
const printBalanceCacheTime = [5, 'minutes']
export function setPrintBalance(balance: number|null) {
  return setItem(printBalanceKey, balance, printBalanceCacheTime)
}
export function getPrintBalance(): CacheResultType<number|null> {
  return getItem(printBalanceKey)
}
