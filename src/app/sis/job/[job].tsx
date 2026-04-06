import React from 'react'
import {Platform} from 'react-native'

/* eslint-disable @typescript-eslint/no-require-imports -- platform-specific conditional import */
const JobDetailView =
	Platform.OS === 'ios'
		? require('../../../views/sis/student-work/detail-ios').JobDetailView
		: require('../../../views/sis/student-work/detail-android').JobDetailView
/* eslint-enable @typescript-eslint/no-require-imports */

export default function JobDetailScreen(): React.ReactNode {
	return <JobDetailView />
}
