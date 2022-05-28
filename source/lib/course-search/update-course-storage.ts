import {fetch} from '@frogpond/fetch'
import type {RawCourseType, CourseType, TermType} from './types'
import {COURSE_DATA_PAGE, INFO_PAGE} from './urls'
import * as storage from '../storage'

type TermInfoType = {
	files: Array<TermType>
	type: string
}

export async function areAnyTermsCached(): Promise<boolean> {
	const localTerms = await storage.getTermInfo()
	return localTerms.length === 0 ? false : true
}

export async function updateStoredCourses(): Promise<boolean> {
	const outdatedTerms: Array<TermType> = await determineOutdatedTerms()
	await Promise.all(
		outdatedTerms.map((term) => storeTermCoursesFromServer(term)),
	)
	// returns `true` if any terms were updated
	return outdatedTerms.length === 0 ? false : true
}

async function determineOutdatedTerms(): Promise<Array<TermType>> {
	const remoteTerms: Array<TermType> = await loadCurrentTermsFromServer()
	const localTerms: Array<TermType> = await storage.getTermInfo()
	if (localTerms.length === 0) {
		await storage.setTermInfo(remoteTerms)
		return remoteTerms
	}
	const outdatedTerms = localTerms.filter((localTerm) => {
		const match = remoteTerms.find(
			(remoteTerm) => remoteTerm.term === localTerm.term,
		)
		return match ? match.hash !== localTerm.hash : true
	})
	if (outdatedTerms.length !== 0) {
		storage.setTermInfo(remoteTerms)
	}
	return outdatedTerms
}

async function loadCurrentTermsFromServer(): Promise<Array<TermType>> {
	const today = new Date()
	const thisYear = today.getFullYear()
	const resp: TermInfoType = await fetch(INFO_PAGE, {cache: 'no-store'})
		.json<TermInfoType>()
		.catch(() => ({
			files: [],
			type: 'error',
		}))
	const terms: Array<TermType> = resp.files.filter(
		(file) => file.type === 'json' && file.year > thisYear - 5,
	)
	return terms
}

async function storeTermCoursesFromServer(term: TermType) {
	const url = COURSE_DATA_PAGE + term.path
	const resp: Array<RawCourseType> = await fetch(url, {cache: 'no-store'})
		.json<Array<RawCourseType>>()
		.catch(() => [])

	const formattedTermData = formatRawData(resp)
	storage.setTermCourseData(term.term, formattedTermData)
}

function formatRawData(rawData: Array<RawCourseType>): Array<CourseType> {
	return rawData.map((course) => {
		const spaceAvailable = course.enrolled < course.max
		return {spaceAvailable: spaceAvailable, ...course}
	})
}
