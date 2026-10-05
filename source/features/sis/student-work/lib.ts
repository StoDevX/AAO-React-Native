import {Platform, Share} from 'react-native'
import type {JobDetail, JobField, JobSummary} from '@frogpond/ccc-jobs'
import {isValid, parseISO} from 'date-fns'
import {jobCode, jobTerm, LEVEL_LABELS, type JobCode} from './posting'
import type {HourlyWages} from './wages'

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

function postedOn(postedDate: string, locales?: string): string | undefined {
	let date = formatPostedDate(postedDate, locales)
	return date ? `Posted ${date}` : undefined
}

export function hourlyWage(code: JobCode, wages: HourlyWages): number {
	return wages[code.structure][code.tier]
}

function formatWage(code: JobCode, wages: HourlyWages | undefined): string | undefined {
	return wages ? `$${hourlyWage(code, wages).toFixed(2)}/hr` : undefined
}

/// The line under a posting's title in the list: its term, unless it is the
/// academic year nearly every posting runs for; its wage, when the title
/// carries a pay code and the wages have loaded; and when it went up.
export function jobRowDetail(
	job: Pick<JobSummary, 'title' | 'postedDate'>,
	wages: HourlyWages | undefined,
	locales?: string,
): string | undefined {
	let code = jobCode(job.title)
	let wage = code ? formatWage(code, wages) : undefined

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
export function jobDetailFields(job: JobDetail, wages: HourlyWages | undefined): JobField[] {
	let code = jobCode(job.title)
	let term = jobTerm(job.title)

	let statedWage = job.fields.find((field) => field.label === WAGE_LABEL)
	let impliedWage = code ? formatWage(code, wages) : undefined
	let wage = statedWage ?? (impliedWage ? {label: WAGE_LABEL, value: impliedWage} : undefined)

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
