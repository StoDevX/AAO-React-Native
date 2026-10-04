import * as React from 'react'
import * as Sentry from '@sentry/react-native'
import {type ErrorBoundaryProps, useNavigation, usePathname, useRouter} from 'expo-router'
import {isChaos} from '@frogpond/launch-arguments'

import {reportFinding} from '../chaos/findings'
import {FATAL_BOUNDARY_ID} from '../chaos/identifiers'
import {openEmail} from '../features/support/open-email'
import {ErrorFallback, type ErrorFallbackAction} from './error-fallback'

/**
 * Shown in place of a screen that failed to render, given to the root stack
 * as `unstable_screenErrorBoundary`. Expo Router wraps each screen in a
 * boundary of its own, so the stack around it carries on: the header's Back
 * button, a sheet's grabber, and every other screen still work. Go Back leaves
 * the broken screen from inside it, for a screen that draws no header of its
 * own; Report a Problem and Send Us an Email let the listener tell the team
 * what they were doing when it broke.
 *
 * Expo Router's boundary reports nothing, so the error goes to Sentry from
 * here. Under chaos it is reported as a fatal finding too: caught here, it
 * would otherwise never reach the chaos run's own boundary, and the run would
 * carry on past it. The fallback also carries that boundary's ID, which the
 * chaos oracle reads as an error screen: in a form sheet or modal the beacon
 * can drop out of the accessibility tree, and the fallback is then the only
 * sign left that the run must stop.
 */
export function ScreenErrorFallback({error, retry}: ErrorBoundaryProps): React.ReactNode {
	let navigation = useNavigation()
	let router = useRouter()
	let pathname = usePathname()

	React.useEffect(() => {
		Sentry.captureException(error, {
			mechanism: {handled: true, type: 'auto.function.react.error_boundary'},
		})
		if (isChaos) {
			reportFinding('fatal', error)
		}
	}, [error])

	let actions: Array<ErrorFallbackAction> = [{label: 'Try Again', onPress: () => void retry()}]
	if (navigation.canGoBack()) {
		actions.push({label: 'Go Back', onPress: () => navigation.goBack()})
	}
	// Left out where the report itself is what broke.
	if (pathname !== '/report-problem') {
		actions.push({label: 'Report a Problem', onPress: () => router.navigate('/report-problem')})
	}
	actions.push({label: 'Send Us an Email', onPress: openEmail})

	return (
		<ErrorFallback
			actions={actions}
			message="This screen hit an error. Trying again often clears it, and the rest of the app still works."
			testID={isChaos ? FATAL_BOUNDARY_ID : undefined}
		/>
	)
}
