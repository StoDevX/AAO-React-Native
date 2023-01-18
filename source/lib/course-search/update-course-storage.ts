import {fetch} from '@frogpond/fetch'
import * as Sentry from '@sentry/react-native'
import type {RawCourseType, CourseType, TermType} from './types'
import {COURSE_DATA_PAGE, infoJson, INFO_PAGE} from './urls'
import * as storage from '../storage'

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
