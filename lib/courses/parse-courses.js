// @flow

import zipObject from 'lodash/zipObject'
import pick from 'lodash/pick'
import mapValues from 'lodash/mapValues'

import {getText, cssSelect, getTrimmedTextWithSpaces} from '../html'
import type {CourseType} from './types'

export function parseCoursesFromDom(dom: mixed, term: number): CourseType[] {
  // We'll need to revisit this if we begin to rely on clbids being present
  const clbidEl = cssSelect('[name=CLBIDLIST]', dom)[0]

  const clbids = clbidEl
    ? clbidEl.attribs.value.split(',').map(Number)
    : []

  const courseRows = cssSelect('tr.sis-line1, tr.sis-line2', dom)

  return courseRows.map((row, i) => rowToCourse(row, clbids[i], term))
}


// Given a <tr> from the SIS, rowToCourse returns a Course
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
      return getTrimmedTextWithSpaces(val)
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

  let deptnum = parseDeptNum(getText(course.deptnum))

  if (deptnum.error) {
    result.department = [deptnum]
    result.number = NaN
  } else {
    result.department = deptnum.department
    result.number = deptnum.number
    result.section = deptnum.section
  }

  return result
}


const deptNumRegex = /(([A-Z]+)(?=\/)(?:\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}) *([A-Z]?)/i

// Splits a deptnum string (like "AS/RE 230A") into its components,
// like {depts: ['AS', 'RE'], num: 230, sect: 'A'}.
function parseDeptNum(deptNumString: string): {error: Error}|{department: string[], number: number, section?: string} {
  // "AS/RE 230A" -> ["AS/RE 230A", "AS/RE", "AS", "RE", "230", "A"]
  // -> {depts: ['AS', 'RE'], num: 230}
  let matches = deptNumRegex.exec(deptNumString)

  if (!matches) {
    return {error: new Error(`Problem parsing ${deptNumString}: no matches found`)}
  }

  return {
    department: matches[1].indexOf('/') !== -1 ? [matches[2], matches[3]] : [matches[1]],
    number: parseInt(matches[4], 10),
    section: matches.length >= 6 && matches[5] ? matches[5] : undefined,
  }
}
