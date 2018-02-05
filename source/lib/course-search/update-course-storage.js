/**
 * @flow
 * updateStoredCourses() handles updating the cached course data from the server
 */

import type {CourseType, TermType} from './types'
import {COURSE_DATA_PAGE, INFO_PAGE} from './urls'
import * as storage from '../storage'

type TermInfoType = {
	files: Array<TermType>,
	type: string,
}

export async function updateStoredCourses(): Promise<boolean> {
	const outdatedTerms: Array<TermType> = await determineOutdatedTerms()
	// console.log(outdatedTerms)
	await Promise.all(outdatedTerms.map(term => storeTermCoursesFromServer(term)))
	return outdatedTerms.length === 0 ? false : true
}

async function loadCurrentTermsFromServer(): Promise<Array<TermType>> {
	const today = new Date()
	const thisYear = today.getFullYear()
	const resp: TermInfoType = await fetchJson(INFO_PAGE).catch(() => ({
		files: [],
		type: 'error',
	}))
	const terms: Array<TermType> = resp.files.filter(
		file => file.type === 'json' && file.year > thisYear - 5,
	)
	return terms
}

async function determineOutdatedTerms(): Promise<Array<TermType>> {
	const remoteTerms: Array<TermType> = await loadCurrentTermsFromServer()
	const localTerms: Array<TermType> = await storage.getTermInfo()
	if (!localTerms) {
		storage.setTermInfo(remoteTerms)
		return remoteTerms
	}
	let outdatedTerms = localTerms.filter(localTerm => {
		const match = remoteTerms.find(
			remoteTerm => remoteTerm.term === localTerm.term,
		)
		return match ? match.hash !== localTerm.hash : true
	})
	if (outdatedTerms.length !== 0) {
		storage.setTermInfo(remoteTerms)
	}
	return outdatedTerms
}

async function storeTermCoursesFromServer(term: TermType) {
	const url = COURSE_DATA_PAGE + term.path
	const resp: Array<CourseType> = await fetchJson(url).catch(() => [])
	storage.setTermCourseData(term.term, resp)
}
