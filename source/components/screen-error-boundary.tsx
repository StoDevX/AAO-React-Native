import * as React from 'react'
import * as Sentry from '@sentry/react-native'
import {isChaos} from '@frogpond/launch-arguments'

import {reportFinding} from '../chaos/findings'
import {ErrorFallback, type ErrorFallbackAction} from './error-fallback'

/**
 * Catches a render error in one screen, reports it to Sentry, and shows
 * `ErrorFallback` in that screen's place. The stack around it carries on, so
 * the header's Back button, a sheet's grabber, and every other screen still
 * work; Go Back leaves the broken screen from inside it, for a screen that
 * draws no header of its own.
 *
 * Under chaos the error is reported as a fatal finding too: caught here, it
 * would otherwise never reach the chaos run's own boundary, and the run would
 * carry on past it.
 */
export function ScreenErrorBoundary({
	children,
	canGoBack,
	goBack,
}: {
	children: React.ReactNode
	canGoBack: () => boolean
	goBack: () => void
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
				return (
					<ErrorFallback
						actions={actions}
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
