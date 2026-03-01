import React from 'react'
import {Platform} from 'react-native'

const JobDetailView =
	Platform.OS === 'ios'
		? require('../../../views/sis/student-work/detail-ios').JobDetailView
		: require('../../../views/sis/student-work/detail-android').JobDetailView

export default function JobDetailScreen(): React.ReactNode {
	return <JobDetailView />
}
