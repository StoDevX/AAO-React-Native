import {Platform, Share} from 'react-native'
import type {JobType} from './types'

export function shareJob(job: JobType): void {
	if (Platform.OS === 'ios') {
		Share.share({
			url: job.url,
		}).catch((error) => { console.log(error.message); })
	} else {
		Share.share({
			message: job.url,
		}).catch((error) => { console.log(error.message); })
	}
}
