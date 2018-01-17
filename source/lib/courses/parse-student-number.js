/**
 * @flow
 * parseStudentNumberFromDom has one job: given an htmlparser2 dom,
 * return the student numbers from within.
 *
 * Note that it may return more than one number: if a student is a
 * proxy, both their student number and the student for whom they
 * are a proxy's numbers will show up in the SIS page.
 */

import uniq from 'lodash/uniq'

import {cssSelect} from '../html'

export function parseStudentNumberFromDom(dom: mixed): number[] {
	const elements = cssSelect('[name=stnum]', dom)
	const stunums = elements.map(node => Number(node.attribs.value))
	return uniq(stunums)
}
