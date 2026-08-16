import {Platform, Share} from 'react-native'
import type {JobDetail} from '@frogpond/ccc-jobs'

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
