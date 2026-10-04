import * as React from 'react'
import * as Sentry from '@sentry/react-native'
import {isChaos} from '@frogpond/launch-arguments'

import {reportFinding} from '../chaos/findings'
import {FATAL_BOUNDARY_ID} from '../chaos/identifiers'
import {openEmail} from '../features/support/open-email'
import {ErrorFallback, type ErrorFallbackAction} from './error-fallback'

/**
 * Catches a render error in one screen, reports it to Sentry, and shows
 * `ErrorFallback` in that screen's place. The stack around it carries on, so
 * the header's Back button, a sheet's grabber, and every other screen still
 * work; Go Back leaves the broken screen from inside it, for a screen that
 * draws no header of its own. Report a Problem and Send Us an Email let the
 * listener tell the team what they were doing when it broke.
 *
 * Under chaos the error is reported as a fatal finding too: caught here, it
 * would otherwise never reach the chaos run's own boundary, and the run would
 * carry on past it. The fallback also carries that boundary's ID, which the
 * chaos oracle reads as an error screen: in a form sheet or modal the beacon
 * can drop out of the accessibility tree, and the fallback is then the only
 * sign left that the run must stop.
 */
export function ScreenErrorBoundary({
	children,
	canGoBack,
	goBack,
	reportProblem,
}: {
	children: React.ReactNode
	canGoBack: () => boolean
	goBack: () => void
	/** Opens the problem report; left out where the report itself is what broke. */
	reportProblem?: () => void
}): React.ReactNode {
	return (
		<Sentry.ErrorBoundary
			fallback={(failed) => {
				let actions: Array<ErrorFallbackAction> = [
					{label: 'Try Again', onPress: () => failed.resetError()},
				]
				if (canGoBack()) {
					actions.push({label: 'Go Back', onPress: goBack})
				}
				if (reportProblem) {
					actions.push({label: 'Report a Problem', onPress: reportProblem})
				}
				actions.push({label: 'Send Us an Email', onPress: openEmail})
				return (
					<ErrorFallback
						actions={actions}
						testID={isChaos ? FATAL_BOUNDARY_ID : undefined}
						message="This screen hit an error. Trying again often clears it, and the rest of the app still works."
					/>
				)
			}}
			onError={(error) => {
				if (isChaos) {
					reportFinding('fatal', error)
				}
			}}
		>
			{children}
		</Sentry.ErrorBoundary>
	)
}
