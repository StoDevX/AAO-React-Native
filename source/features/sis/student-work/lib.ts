import {Platform, Share} from 'react-native'
import type {JobDetail} from '@frogpond/ccc-jobs'
import {format, isValid, parseISO} from 'date-fns'

/// `PostedDate` is a plain `YYYY-MM-DD` with no zone, parsed as local time so
/// the date a student sees is the date Oracle published.
export function postedOn(postedDate: string): string | undefined {
	let parsed = parseISO(postedDate)
	return isValid(parsed) ? `Posted ${format(parsed, 'MMMM d, yyyy')}` : undefined
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
