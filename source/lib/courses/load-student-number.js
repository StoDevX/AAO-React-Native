/**
 * @flow
 * loadStudentNumber fetches the student number from the SIS.
 */

import startsWith from 'lodash/startsWith'

import * as cache from '../cache'
import {parseHtml} from '../html'
import {GRADES_PAGE, LANDING_PAGE} from './urls'
import {parseStudentNumberFromDom} from './parse-student-number'

type PromisedDataType = Promise<
	{error: true, value: Error} | {error: false, value: number},
>

export async function loadStudentNumber({
	force,
	isConnected,
}: {
	force?: boolean,
	isConnected: boolean,
}): PromisedDataType {
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

	if (value === null || value === undefined) {
		return {
			error: true,
			value: new Error('Problem loading student information from the SIS'),
		}
	}

	return {error: false, value: value}
}

async function fetchStudentNumberFromServer(): PromisedDataType {
	const resp = await fetch(GRADES_PAGE)
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
