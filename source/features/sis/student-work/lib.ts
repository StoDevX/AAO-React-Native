import {Platform, Share} from 'react-native'
import type {JobDetail, JobSummary} from '@frogpond/ccc-jobs'
import {isValid, parseISO} from 'date-fns'
import {jobCode, type JobCode} from './posting'

/// The title of a posting's description, both the row that opens it and the
/// screen it opens. Mirrored by `TestIdentifiers.StudentWork.jobDescriptionRow`.
export const JOB_DESCRIPTION_TITLE = 'Description'

/// `PostedDate` is a plain `YYYY-MM-DD` with no zone, parsed as local time so
/// the date a student sees is the date Oracle published.
///
/// `locales` defaults to the device's own, so the date reads the way the rest
/// of the phone writes dates.
export function postedOn(postedDate: string, locales?: string): string | undefined {
	let parsed = parseISO(postedDate)
	if (!isValid(parsed)) return undefined

	let date = new Intl.DateTimeFormat(locales, {dateStyle: 'medium'}).format(parsed)
	return `Posted ${date}`
}

/// Dollars an hour, by structure and tier, for the 2026–27 academic year.
/// St. Olaf revises these each year; the source is
/// https://wp.stolaf.edu/studentemployment/student-employment-compensation-philosophy/
const HOURLY_WAGES: Record<JobCode['structure'], Record<JobCode['tier'], number>> = {
	ST: {1: 12.0, 2: 12.5, 3: 13.0},
	NST: {1: 13.5, 2: 14.5, 3: 15.5},
	OSA: {1: 12.5, 2: 13.25, 3: 14.0},
}

export function hourlyWage(code: JobCode): number {
	return HOURLY_WAGES[code.structure][code.tier]
}

/// The line under a posting's title in the list: its wage, when the title
/// carries a pay code, and when it went up.
export function jobRowDetail(
	job: Pick<JobSummary, 'title' | 'postedDate'>,
	locales?: string,
): string | undefined {
	let code = jobCode(job.title)
	let wage = code ? `$${hourlyWage(code).toFixed(2)}/hr` : undefined

	let parts = [wage, postedOn(job.postedDate, locales)].filter((part) => part !== undefined)
	return parts.length > 0 ? parts.join(' · ') : undefined
}

export function shareJob(job: JobDetail): void {
	if (Platform.OS === 'ios') {
		Share.share({
			url: job.url,
		}).catch((error) => console.log(String(error)))
	} else {
		Share.share({
			message: job.url,
		}).catch((error) => console.log(String(error)))
	}
}
