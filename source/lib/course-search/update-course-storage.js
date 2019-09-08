/**
 * @flow
 * updateStoredCourses() handles updating the cached course data from the server
 */

import {fetch} from '@frogpond/fetch'
import type {RawCourseType, CourseType, TermType} from './types'
import {COURSE_DATA_PAGE, INFO_PAGE} from './urls'
import * as storage from '../storage'

type TermInfoType = {
	files: Array<TermType>,
	type: string,
}

export async function areAnyTermsCached(): Promise<boolean> {
	let localTerms = await storage.getTermInfo()
	return localTerms.length === 0 ? false : true
}

export async function updateStoredCourses(): Promise<boolean> {
	let outdatedTerms: Array<TermType> = await determineOutdatedTerms()
	await Promise.all(outdatedTerms.map(term => storeTermCoursesFromServer(term)))
	// returns `true` if any terms were updated
	return outdatedTerms.length === 0 ? false : true
}

async function determineOutdatedTerms(): Promise<Array<TermType>> {
	let remoteTerms: Array<TermType> = await loadCurrentTermsFromServer()
	let localTerms: Array<TermType> = await storage.getTermInfo()
	if (localTerms.length === 0) {
		await storage.setTermInfo(remoteTerms)
		return remoteTerms
	}
	let outdatedTerms = localTerms.filter(localTerm => {
		let match = remoteTerms.find(
			remoteTerm => remoteTerm.term === localTerm.term,
		)
		return match ? match.hash !== localTerm.hash : true
	})
	if (outdatedTerms.length !== 0) {
		storage.setTermInfo(remoteTerms)
	}
	return outdatedTerms
}

async function loadCurrentTermsFromServer(): Promise<Array<TermType>> {
	let today = new Date()
	let thisYear = today.getFullYear()
	let resp: TermInfoType = await fetch(INFO_PAGE, {cache: 'no-store'})
		.json()
		.catch(() => ({
			files: [],
			type: 'error',
		}))
	let terms: Array<TermType> = resp.files.filter(
		file => file.type === 'json' && file.year > thisYear - 5,
	)
	return terms
}

async function storeTermCoursesFromServer(term: TermType) {
	let url = COURSE_DATA_PAGE + term.path
	let resp: Array<RawCourseType> = await fetch(url, {cache: 'no-store'})
		.json()
		.catch(() => [])

	let formattedTermData = formatRawData(resp)
	storage.setTermCourseData(term.term, formattedTermData)
}

function formatRawData(rawData: Array<RawCourseType>): Array<CourseType> {
	return rawData.map(course => {
		let spaceAvailable = course.enrolled < course.max
		return {spaceAvailable: spaceAvailable, ...course}
	})
}
