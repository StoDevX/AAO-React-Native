// @flow
import {Platform, Share} from 'react-native'
import querystring from 'query-string'
import type {JobType} from './types'

export function shareJob(job: JobType) {
	const jobBaseUrl = 'https://www.stolaf.edu/apps/stuwork/index.cfm?'
	const query = querystring.stringify({
		fuseaction: 'Details',
		jobID: job.id,
	})
	const url = `${jobBaseUrl}${query}`

	if (Platform.OS === 'ios') {
		Share.share({
			url: url,
		}).catch(error => console.log(error.message))
	} else {
		Share.share({
			message: url,
		}).catch(error => console.log(error.message))
	}
}
