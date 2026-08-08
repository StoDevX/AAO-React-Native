import {Alert} from 'react-native'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

export const openReportProblem = (): void => {
	if (!IS_PRODUCTION) {
		Alert.alert(
			'Sentry is disabled',
			'Problem reporting only works in production builds.',
		)
		return
	}

	Sentry.showFeedbackWidget()
}
