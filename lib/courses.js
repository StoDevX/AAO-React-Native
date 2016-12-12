// @flow
import {
  api,
  isLoggedIn,
} from '../lib/login'
import { AsyncStorage, NetInfo } from 'react-native'

import buildFormData from './formdata'
import {parseHtml, cssSelect, getText} from './html'

import zipObject from 'lodash/zipObject'
import pick from 'lodash/pick'
import zip from 'lodash/zip'
import mapValues from 'lodash/mapValues'
import isError from 'lodash/isError'
import moment from 'moment'
import startsWith from 'lodash/startsWith'

const ERROR_URL = 'https://www.stolaf.edu/sis/landing-page.cfm'

export type CourseType = {
  department: string[],
  number: number,
  section?: string,
  lab: boolean,
  name: string,
  credits: number,
  gradeOption: string,
  gereqs: string[],
  times?: string[],
  locations?: string[],
  instructors: string[],
  clbid: number,
  term: number,
};

const COURSES__STNUM = 'courses:student-number'
const COURSES__TERM = term => `courses:${term}`
const COURSES__TERM_LIST = 'courses:term-list'
const COURSES__CACHE__COURSES = 'courses:cache-time:courses'
const COURSES__CACHE__TERM_LIST = 'courses:cache-time:term-list'

type CourseMappingType = {[key: string]: (CourseType|Error)[]};
export async function loadAllCourses(forceFromServer?: bool): Promise<CourseMappingType> {
  // await AsyncStorage.removeItem(COURSES__CACHE__COURSES)
  let timeLastFetched = JSON.parse(await AsyncStorage.getItem(COURSES__CACHE__COURSES))
  let needsUpdate = moment(timeLastFetched).isBefore(moment().subtract(1, 'hour'))

  let isConnected = await NetInfo.isConnected.fetch()
  if (isConnected && (!timeLastFetched || needsUpdate || forceFromServer)) {
    return getAllCoursesFromServer()
  }

  return getAllCoursesFromStorage()
}


async function getAllCoursesFromServer(): Promise<{[key: string]: (CourseType|Error)[]}> {
  console.log('getAllCoursesFromServer')

  let terms: Error|number[] = await getTermList()
  if (isError(terms)) {
    return ((terms: any): Error)
  }

  let courseListPromises = ((terms: any): number[]).map(getCourseList)
  let courseLists = await Promise.all(courseListPromises)

  let zipped = zip(terms, courseLists)

  let storagePromises = zipped.map(([term, courses]) =>
    AsyncStorage.setItem(COURSES__TERM(term), JSON.stringify(courses)))

  let timeLastFetched = AsyncStorage.setItem(COURSES__CACHE__COURSES, JSON.stringify(new Date()))
  storagePromises.push(timeLastFetched)

  await Promise.all(storagePromises)

  return zipObject(terms, courseLists)
}

async function getAllCoursesFromStorage(): Promise<{[key: string]: (CourseType|Error)[]}> {
  console.log('getAllCoursesFromStorage')

  let terms = JSON.parse(await AsyncStorage.getItem(COURSES__TERM_LIST))
  let dataPromises = terms.map(term => AsyncStorage.getItem(`courses:${term}`))
  let data = await Promise.all(dataPromises)
  return zipObject(terms, data.map(courses => JSON.parse(courses)))
}



async function getSisTermListingsPage(): Promise<string|Error|null> {
  try {
    let resp = await api.get('/sis/st-courses.cfm')
    if (startsWith(resp.url, ERROR_URL)) {
      await AsyncStorage.setItem('credentials:valid', JSON.stringify(false))
      return new Error('Authentication Error')
    }
    return resp.body
  } catch (err) {
    console.error(err)
    return null
  }
}

async function getSisCoursesPage(term: number): Promise<string|Error|null> {
  let stnum = JSON.parse(await AsyncStorage.getItem(COURSES__STNUM))
  let form = buildFormData({stnum, searchyearterm: term})
  try {
    let resp = await api.post('/sis/st-courses.cfm', {body: form})
    if (startsWith(resp.url, ERROR_URL)) {
      await AsyncStorage.setItem('credentials:valid', JSON.stringify(false))
      return new Error('Authentication Error')
    }
    return resp.body
  } catch (err) {
    console.error(err)
    return null
  }
}

async function getTermList(): Promise<number[]|Error> {
  let timeLastFetched = JSON.parse(await AsyncStorage.getItem(COURSES__CACHE__TERM_LIST))
  let needsUpdate = moment(timeLastFetched).isBefore(moment().subtract(1, 'hour'))
  if (!timeLastFetched || needsUpdate) {
    return getTermListFromServer()
  }
  return getTermListFromStorage()
}

async function getTermListFromStorage(): Promise<number[]> {
  return JSON.parse(await AsyncStorage.getItem(COURSES__TERM_LIST))
}

async function getTermListFromServer(): Promise<number[]|Error> {
  // let {username, password} = await loadLoginCredentials()
  // let {result} = await sisLogin(username, password)
  let result = await isLoggedIn()
  if (!result) {
    return []
  }

  let page = await getSisTermListingsPage()
  if (!page) {
    return []
  }
  if (isError(page)) {
    return ((page: any): Error)
  }

  let dom = parseHtml(((page: any): string))
  let stunum = getStudentNumberFromPage(dom)
  if (stunum === null) {
    throw new Error('no student number!')
  } else if (stunum.choices) {
    throw new Error('multiple student numbers!')
  }

  let terms = cssSelect('[name=searchyearterm]', dom)[0]
    .children
    .filter(node => node.type === 'tag' && node.name === 'option')
    .map(opt => Number(opt.attribs.value))

  await Promise.all([
    AsyncStorage.setItem(COURSES__TERM_LIST, JSON.stringify(terms)),
    AsyncStorage.setItem(COURSES__CACHE__TERM_LIST, JSON.stringify(new Date())),
    AsyncStorage.setItem(COURSES__STNUM, JSON.stringify(stunum)),
  ])

  return terms
}

function getStudentNumberFromPage(dom): number|null|{choices: number[]} {
  let stunumelements = cssSelect('[name=stnum]', dom)
  if (!stunumelements.length) {
    return null
  }
  let stunums = stunumelements.map(node => node.attribs.value)
  if (new Set(stunums).size > 1) {
    return {choices: stunums}
  }
  return stunums[0]
}

async function getCourseList(term: number): Promise<Array<Error|CourseType>> {
  let page = await getSisCoursesPage(term)
  if (!page) {
    return []
  }
  if (isError(page)) {
    return [((page: any): Error)]
  }

  let dom = parseHtml(((page: any): string))
  // We'll need to revisit this if we begin to rely on clbids being present
  let clbidEl = cssSelect('[name=CLBIDLIST]', dom)[0]
  let clbids = []
  if (clbidEl) {
    clbids = clbidEl.attribs.value.split(',').map(Number)
  }
  let courseRows = cssSelect('tr.sis-line1, tr.sis-line2', dom)

  try {
    return courseRows.map((row, i) => rowToCourse(row, clbids[i], term))
  } catch (err) {
    console.warn(term, err)
    return [new Error(`Error loading ${term}: ${err.message}`)]
  }
}

function rowToCourse(domRow: Object, clbid: number, term: number): CourseType {
  let children = domRow.children.filter(node => node.type === 'tag')
  let cells = [
    'deptnum',
    'lab',
    'name',
    'halfsemester',
    'credits',
    'gradeOption',
    'gereqs',
    'times',
    'locations',
    'instructors',
  ]

  let course = zipObject(cells, children)
  let result = pick(course, ['lab', 'name', 'credits', 'gradeOption', 'times', 'locations', 'instructors'])

  result = mapValues(result, (val, key) => {
    if (key === 'times' || key === 'locations' || key === 'instructors' || key === 'gereqs') {
      if (!val) {
        return undefined
      }
      return val.children.map(getText)
        .map(t => t.trim())  // trim off extra chars
        .filter(t => t)  // remove any blank strings
        .map(t => t.replace(/\s+/, ' '))  // remove any extra internal space
    }
    if (key === 'credits') {
      return Number(getText(val))
    }
    if (key === 'lab') {
      return getText(val).trim() === 'L'
    }
    return getText(val).trim()
  })

  result.clbid = clbid
  result.term = term
  let deptnum = getText(course.deptnum)
  try {
    let {department, number, section} = parseDeptNum(deptnum)
    result.department = department
    result.number = number
    result.section = section
  } catch (err) {
    result.department = [deptnum]
    result.number = NaN
  }

  return result
}

const deptNumRegex = /(([A-Z]+)(?=\/)(?:\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}) *([A-Z]?)/i

// Splits a deptnum string (like "AS/RE 230A") into its components,
// like {depts: ['AS', 'RE'], num: 230, sect: 'A'}.
function parseDeptNum(deptNumString: string): {department: string[], number: number, section?: string} {
  // "AS/RE 230A" -> ["AS/RE 230A", "AS/RE", "AS", "RE", "230", "A"]
  // -> {depts: ['AS', 'RE'], num: 230}
  let matches = deptNumRegex.exec(deptNumString)

  if (!matches) {
    throw new Error(`Problem parsing ${deptNumString}: no matches found`)
  }

  return {
    department: matches[1].indexOf('/') !== -1 ? [matches[2], matches[3]] : [matches[1]],
    number: parseInt(matches[4], 10),
    section: matches.length >= 6 && matches[5] ? matches[5] : undefined,
  }
}
