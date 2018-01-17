// @flow

import zipObject from 'lodash/zipObject'
import pick from 'lodash/pick'
import mapValues from 'lodash/mapValues'
import includes from 'lodash/includes'
import isNil from 'lodash/isNil'
import _isNaN from 'lodash/isNaN'

import {getText, cssSelect, getTrimmedTextWithSpaces} from '../html'
import type {CourseType, CoursesByTermType} from './types'

export function parseCoursesFromDom(dom: mixed): CoursesByTermType {
	const courseRows = cssSelect(
		'td.sis-termheader, tr.sis-line1, tr.sis-line2',
		dom,
	)
	// console.log(courseRows)
	const groupedByTerm: {[key: string]: CourseType[]} = {}

	// explicitly say that this is `any` because it should immediately become a string
	let currentTerm: any = null
	for (let row of courseRows) {
		// console.log(row)
		if (includes(row.attribs.class, 'sis-termheader')) {
			currentTerm = getText(row)
			groupedByTerm[currentTerm] = groupedByTerm[currentTerm] || []
		} else {
			let course = rowToCourse(row, currentTerm)
			groupedByTerm[currentTerm].push(course)
		}
	}
	// console.log(groupedByTerm)

	return groupedByTerm
}

// Given a <tr> from the SIS, rowToCourse returns a Course
function rowToCourse(domRow: Object, term: string): CourseType {
	let children = domRow.children.filter(node => node.type === 'tag')
	let cells = ['deptnum', 'name', 'instructors', 'credits', 'grade']

	let course = zipObject(cells, children)
	let result = pick(course, ['name', 'instructors', 'credits', 'grade'])

	result = mapValues(result, (val, key) => {
		if (!val) {
			return undefined
		}
		switch (key) {
			case 'instructors':
				return getTrimmedTextWithSpaces(val)
			case 'credits':
				return Number(getText(val))
			default:
				return getText(val).trim()
		}
	})

	result.term = term

	result.deptnum = parseDeptNum(getText(course.deptnum))
	if (result.deptnum instanceof Error) {
		result.deptnum = result.deptnum.message
	}

	return result
}

const deptNumRegex = /(([A-Z]+)(?=\/)(?:\/)([A-Z]+)|[A-Z]+) *([0-9]{3,}?) *([A-Z]?)/i

// Splits a deptnum string (like "AS/RE 230A") into its components,
// like {depts: ['AS', 'RE'], num: 230, sect: 'A'}.
function parseDeptNum(deptNumString: string): Error | string {
	// "AS/RE 230A" -> ["AS/RE 230A", "AS/RE", "AS", "RE", "230", "A"]
	// -> {depts: ['AS', 'RE'], num: 230}
	let matches = deptNumRegex.exec(deptNumString)

	if (!matches) {
		return new Error(`Problem parsing ${deptNumString}: no matches found`)
	}

	let department =
		matches[1].indexOf('/') !== -1 ? [matches[2], matches[3]] : [matches[1]]
	department = department.join('/')

	let number = parseInt(matches[4], 10)
	number = _isNaN(number) || isNil(number) ? '' : number

	let section = matches.length >= 6 && matches[5] ? matches[5] : ''

	return `${department} ${number}${section}`
}
