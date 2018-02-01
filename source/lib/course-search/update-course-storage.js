/**
 * @flow
 * updateStoredCourses() handles updating the cached course data from the server
 */

import type {CourseType, TermType} from './types'
import {
	COURSE_DATA_PAGE,
	INFO_PAGE,
	COURSE_STORAGE_DIR,
	TERMS_FILE,
} from './urls'
import RNFS from 'react-native-fs'

type TermInfoType = {
	files: Array<TermType>,
	type: string,
}

export async function updateStoredCourses(): Promise<boolean> {
	RNFS.readDir(COURSE_STORAGE_DIR + '/terms').catch(() => {
		RNFS.mkdir(COURSE_STORAGE_DIR + '/terms')
	})
	const outdatedTerms: Array<TermType> = await determineOutdatedTerms()
	const promises = outdatedTerms.map(term =>
		storeTermCoursesFromServer(term.path),
	)
	await Promise.all(promises)
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

export function loadTermsFromStorage(): Promise<Array<TermType>> {
	return RNFS.readFile(TERMS_FILE)
		.then(contents => {
			return JSON.parse(contents)
		})
		.catch(() => {
			return []
		})
}

async function determineOutdatedTerms(): Promise<Array<TermType>> {
	const remoteTerms: Array<TermType> = await loadCurrentTermsFromServer()
	const localTerms: Array<TermType> = await loadTermsFromStorage()
	if (localTerms.length === 0) {
		storeTermInfo(remoteTerms)
		return remoteTerms
	}
	let outdatedTerms = localTerms.filter(localTerm => {
		const match = remoteTerms.find(
			remoteTerm => remoteTerm.term === localTerm.term,
		)
		return match === undefined ? true : localTerm.hash != match.hash
	})
	if (outdatedTerms.length !== 0) {
		storeTermInfo(remoteTerms)
	}
	return outdatedTerms
}

function storeTermInfo(terms: Array<TermType>) {
	let json = JSON.stringify(terms)
	RNFS.writeFile(TERMS_FILE, json, 'utf8')
}

async function storeTermCoursesFromServer(path: string): Promise<boolean> {
	const url = COURSE_DATA_PAGE + path
	const resp: Array<CourseType> = await fetchJson(url)
	const courseJson = JSON.stringify(resp)
	const filePath = COURSE_STORAGE_DIR + path
	return RNFS.writeFile(filePath, courseJson, 'utf8')
		.then(() => true)
		.catch(() => false)
}
