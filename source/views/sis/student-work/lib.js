// @flow
import {Share} from 'react-native'
import type {JobType} from './types'

export function shareJob(job: JobType) {
	const jobBaseUrl =
		'https://www.stolaf.edu/apps/stuwork/index.cfm?fuseaction=Details&jobID='
	Share.share({
		message: `${jobBaseUrl}${job.id}`,
	}).catch(error => console.log(error.message))
}
