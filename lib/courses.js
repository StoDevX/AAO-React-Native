// @flow
import {
    api,
    loadLoginCredentials,
    sisLogin,
} from '../lib/login'
import { AsyncStorage } from 'react-native'

import buildFormData from './formdata'
import {parseHtml, cssSelect, getText} from './html'

import zipObject from 'lodash/zipObject'
import pick from 'lodash/pick'
import zip from 'lodash/zip'
import mapValues from 'lodash/mapValues'
import moment from 'moment'

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


export async function loadAllCourses(forceFromServer?: bool): Promise<{[key: string]: (CourseType|Error)[]}> {
  // await AsyncStorage.removeItem(COURSES__CACHE__COURSES)
  let timeLastFetched = JSON.parse(await AsyncStorage.getItem(COURSES__CACHE__COURSES))
  let needsUpdate = moment(timeLastFetched).isBefore(moment().subtract(1, 'hour'))
  if (!timeLastFetched || needsUpdate || forceFromServer) {
    return await getAllCoursesFromServer()
  }
  return await getAllCoursesFromStorage()
}


async function getAllCoursesFromServer(): Promise<{[key: string]: (CourseType|Error)[]}> {
  console.log('getAllCoursesFromServer')

  let terms = await getTermList()

  let courseListPromises = terms.map(getCourseList)
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



async function getSisTermListingsPage() {
  try {
    return (await api.get('/sis/st-courses.cfm')).body
  } catch (err) {
    console.error(err)
    return null
  }
}

async function getSisCoursesPage(term: number) {
  let stnum = JSON.parse(await AsyncStorage.getItem(COURSES__STNUM))
  let form = buildFormData({stnum, searchyearterm: term})
  try {
    return (await api.post('/sis/st-courses.cfm', {body: form})).body
  } catch (err) {
    console.error(err)
    return null
  }
}

async function getTermList(): Promise<number[]> {
  let timeLastFetched = JSON.parse(await AsyncStorage.getItem(COURSES__CACHE__TERM_LIST))
  let needsUpdate = moment(timeLastFetched).isBefore(moment().subtract(1, 'hour'))
  if (!timeLastFetched || needsUpdate) {
    return await getTermListFromServer()
  }
  return await getTermListFromStorage()
}

async function getTermListFromStorage(): Promise<number[]> {
  return JSON.parse(await AsyncStorage.getItem(COURSES__TERM_LIST))
}

async function getTermListFromServer(): Promise<number[]> {
  let {username, password} = await loadLoginCredentials()
  let {result} = await sisLogin(username, password)
  if (!result) {
    return []
  }

  let page = await getSisTermListingsPage()
  if (!page) {
    return []
  }

  let dom = parseHtml(page)
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

async function getCourseList(term: number): Promise<(Error|CourseType)[]> {
  let page = await getSisCoursesPage(term)
  if (!page) {
    return []
  }

  let dom = parseHtml(page)
  let clbids = cssSelect('[name=CLBIDLIST]', dom)[0].attribs.value.split(',').map(Number)
  let courseRows = cssSelect('tr.sis-line1, tr.sis-line2', dom)

  try {
    return courseRows.map((row, i) => rowToCourse(row, clbids[i], term))
  } catch (err) {
    return [new Error(`Error loading ${term}.`)]
  }
}

function rowToCourse(domRow: Object, clbid: number, term: number): CourseType {
  let children = domRow.children.filter(node => node.type === 'tag').map(getText)
  console.log(children)
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
  result = mapValues(result, val => val.trim())

  let {department, number, section} = parseDeptNum(course.deptnum)
  result.department = department
  result.number = number
  result.section = section
  result.clbid = clbid
  result.term = term
  result.credits = Number(result.credits)
  result.lab = result.lab === 'L'
  result.locations = result.locations ? [result.locations] : undefined
  result.times = result.times ? [result.times] : result.times

  return result
}

const deptNumRegex = /(([A-Z]+)(?=\/)(?:\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}) *([A-Z]?)/i

// Splits a deptnum string (like "AS/RE 230A") into its components,
// like {depts: ['AS', 'RE'], num: 230, sect: 'A'}.
function parseDeptNum(deptNumString: string): {department: string[], number: number, section?: string} {
  // "AS/RE 230A" -> ["AS/RE 230A", "AS/RE", "AS", "RE", "230", "A"]
  // -> {depts: ['AS', 'RE'], num: 230}
  let matches = deptNumRegex.exec(deptNumString)

  return {
    department: matches[1].indexOf('/') !== -1 ? [matches[2], matches[3]] : [matches[1]],
    number: parseInt(matches[4], 10),
    section: matches.length >= 6 && matches[5] ? matches[5] : undefined,
  }
}
