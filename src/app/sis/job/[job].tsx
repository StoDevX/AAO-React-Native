import React from 'react'
import {Platform} from 'react-native'

const JobDetailView = React.lazy(() =>
	Platform.OS === 'ios'
		? import('../../../views/sis/student-work/detail-ios').then((m) => ({
				default: m.JobDetailView,
			}))
		: import('../../../views/sis/student-work/detail-android').then((m) => ({
				default: m.JobDetailView,
			})),
)

export default function JobDetailScreen(): React.JSX.Element {
	return (
		<React.Suspense>
			<JobDetailView />
		</React.Suspense>
	)
}
