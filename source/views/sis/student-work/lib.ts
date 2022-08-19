import {Platform, Share} from 'react-native'
import querystring from 'query-string'
import type {JobType} from './types'

export function createJobFullUrl(job: JobType): string {
	let jobBaseUrl = 'https://www.stolaf.edu/apps/stuwork/index.cfm?'
	let query = querystring.stringify({
		fuseaction: 'Details',
		jobID: String(job.id),
	})
	return `${jobBaseUrl}${query}`
}

export function shareJob(job: JobType): void {
	let url = createJobFullUrl(job)
	if (Platform.OS === 'ios') {
		Share.share({
			url: url,
		}).catch((error) => console.log(error.message))
	} else {
		Share.share({
			message: url,
		}).catch((error) => console.log(error.message))
	}
}
