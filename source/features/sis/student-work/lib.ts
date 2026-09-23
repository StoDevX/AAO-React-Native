import {Platform, Share} from 'react-native'
import type {JobDetail, JobField, JobSummary} from '@frogpond/ccc-jobs'
import {isValid, parseISO} from 'date-fns'
import {jobCode, jobTerm, LEVEL_LABELS, type JobCode} from './posting'

/// The title of a posting's description, both the row that opens it and the
/// screen it opens. Mirrored by `TestIdentifiers.StudentWork.jobDescriptionRow`.
export const JOB_DESCRIPTION_TITLE = 'Description'

/// Building an `Intl.DateTimeFormat` costs far more than using one, and the
/// list formats a date per row on every render, so each locale's is kept.
const postedDateFormats = new Map<string, Intl.DateTimeFormat>()

function postedDateFormat(locales: string | undefined): Intl.DateTimeFormat {
	let key = locales ?? ''
	let cached = postedDateFormats.get(key)
	if (cached) return cached

	let created = new Intl.DateTimeFormat(locales, {dateStyle: 'medium'})
	postedDateFormats.set(key, created)
	return created
}

/// A posting's date as the list and its own screen both show it, in the
/// device's own style when `locales` is left out.
///
/// The list's `PostedDate` is a plain `YYYY-MM-DD` with no zone, parsed as
/// local time so the date a student sees is the date Oracle published.
export function formatPostedDate(
	postedDate: string | undefined,
	locales?: string,
): string | undefined {
	if (!postedDate) return undefined

	let parsed = parseISO(postedDate)
	return isValid(parsed) ? postedDateFormat(locales).format(parsed) : undefined
}

export function postedOn(postedDate: string, locales?: string): string | undefined {
	let date = formatPostedDate(postedDate, locales)
	return date ? `Posted ${date}` : undefined
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

function formatWage(code: JobCode): string {
	return `$${hourlyWage(code).toFixed(2)}/hr`
}

/// The line under a posting's title in the list: its term, unless it is the
/// academic year nearly every posting runs for; its wage, when the title
/// carries a pay code; and when it went up.
export function jobRowDetail(
	job: Pick<JobSummary, 'title' | 'postedDate'>,
	locales?: string,
): string | undefined {
	let code = jobCode(job.title)
	let wage = code ? formatWage(code) : undefined

	let term = jobTerm(job.title)
	let unusualTerm = term === 'Academic Year' ? undefined : term

	let parts = [unusualTerm, wage, postedOn(job.postedDate, locales)].filter(
		(part) => part !== undefined,
	)
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

const WAGE_LABEL = 'Wage'

/// The rows a posting's Details section shows: its wage, then the level and
/// term its title carries, then the rest of what its description says.
///
/// The listing's own Wage is what the employer wrote, so it wins. The wage the
/// title's pay code implies fills in only when the listing states none.
export function jobDetailFields(job: JobDetail): JobField[] {
	let code = jobCode(job.title)
	let term = jobTerm(job.title)

	let statedWage = job.fields.find((field) => field.label === WAGE_LABEL)
	let wage = statedWage ?? (code ? {label: WAGE_LABEL, value: formatWage(code)} : undefined)

	let fromTitle: JobField[] = []
	if (code) {
		fromTitle.push({label: 'Level', value: LEVEL_LABELS[code.tier]})
	}
	if (term) {
		fromTitle.push({label: 'Term', value: term})
	}

	let rest = job.fields.filter((field) => field.label !== WAGE_LABEL)
	return [...(wage ? [wage] : []), ...fromTitle, ...rest]
}

/// Which of its three states the Student Work list is in.
///
/// Postings are saved between launches, so a failed refetch still has the
/// last good board to show; the error is only for a load with nothing saved.
export function listState(query: {
	isError: boolean
	isLoading: boolean
	hasPostings: boolean
}): 'error' | 'loading' | 'list' {
	if (query.hasPostings) return 'list'
	if (query.isError) return 'error'
	if (query.isLoading) return 'loading'
	return 'list'
}
