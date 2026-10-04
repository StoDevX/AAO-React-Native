import * as React from 'react'
import * as Sentry from '@sentry/react-native'

import {ErrorFallback} from './error-fallback'

/**
 * Catches an error anywhere in the app, rendering or fatal, reports it to
 * Sentry, and shows `ErrorFallback` in place of a blank screen that only a
 * force-quit clears. Try Again renders the app afresh.
 *
 * A screen that fails to render is caught sooner, by `ScreenErrorBoundary`;
 * this one is left the failures outside any screen.
 */
export function RootErrorBoundary({children}: {children: React.ReactNode}): React.ReactNode {
	return (
		<Sentry.GlobalErrorBoundary
			fallback={(error) => (
				<ErrorFallback
					actions={[{label: 'Try Again', onPress: () => error.resetError()}]}
					message="All About Olaf hit an error. Trying again often clears it; if it doesn’t, close and reopen the app."
				/>
			)}
		>
			{children}
		</Sentry.GlobalErrorBoundary>
	)
}
