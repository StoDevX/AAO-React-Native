import React from 'react'
import {Platform} from 'react-native'

import {JobDetailView as JobDetailViewIos} from '../../../views/sis/student-work/detail-ios'
import {JobDetailView as JobDetailViewAndroid} from '../../../views/sis/student-work/detail-android'

const JobDetailView =
	Platform.OS === 'ios' ? JobDetailViewIos : JobDetailViewAndroid

export default function JobDetailScreen(): React.ReactNode {
	return <JobDetailView />
}
