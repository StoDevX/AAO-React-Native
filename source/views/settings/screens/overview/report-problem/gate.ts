import {Alert} from 'react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

export function openReportProblem(navigate: () => void): void {
	if (!IS_PRODUCTION) {
		Alert.alert(
			'Sentry is disabled',
			'Problem reporting only works in production builds.',
		)
		return
	}

	navigate()
}
