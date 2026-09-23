import type {JobSummary} from '@frogpond/ccc-jobs'
import {differenceInCalendarDays, isValid, parseISO} from 'date-fns'
import {jobCode, jobTerm} from './posting'

export const POSTED_RECENT = 'Last 30 days'
export const POSTED_NEW = 'New since last visit'

/// Today and the 29 days before it.
const RECENT_DAYS = 30

/// A landing-screen shortcut: a postings list opened with one filter chosen.
export type Preset = {
	key: 'new' | 'recent' | 'entry' | 'summer' | 'all'
	title: string
	/// The postings route's parameters; see prefill.ts.
	params: Record<string, string>
}

export const PRESETS: Preset[] = [
	{key: 'new', title: 'New since your last visit', params: {posted: 'new'}},
	{key: 'recent', title: 'Recent postings', params: {posted: 'recent'}},
	{key: 'entry', title: 'Entry-level jobs', params: {level: 'entry'}},
	{key: 'summer', title: 'Summer jobs', params: {term: 'summer'}},
	{key: 'all', title: 'All job postings', params: {}},
]

/// The Posted filter's values a posting has.
export function postedTags(job: JobSummary, newIds: Set<string>, today: Date): string[] {
	let tags: string[] = []
	let posted = parseISO(job.postedDate)
	if (isValid(posted) && differenceInCalendarDays(today, posted) < RECENT_DAYS) {
		tags.push(POSTED_RECENT)
	}
	if (newIds.has(job.id)) {
		tags.push(POSTED_NEW)
	}
	return tags
}

/// Each preset's posting count, from the board alone, so none waits on the
/// unit searches.
export function presetCounts(
	jobs: JobSummary[],
	newIds: Set<string>,
	today: Date,
): Record<Preset['key'], number> {
	let counts = {new: 0, recent: 0, entry: 0, summer: 0, all: jobs.length}
	for (let job of jobs) {
		let tags = postedTags(job, newIds, today)
		if (tags.includes(POSTED_NEW)) counts.new += 1
		if (tags.includes(POSTED_RECENT)) counts.recent += 1
		if (jobCode(job.title)?.tier === 1) counts.entry += 1
		if (jobTerm(job.title) === 'Summer') counts.summer += 1
	}
	return counts
}
