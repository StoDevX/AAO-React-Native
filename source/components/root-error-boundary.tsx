import * as React from 'react'
import * as Sentry from '@sentry/react-native'

import {openEmail} from '../features/support/open-email'
import {ErrorFallback} from './error-fallback'

/**
 * Catches an error anywhere in the app, rendering or fatal, reports it to
 * Sentry, and shows `ErrorFallback` in place of a blank screen that only a
 * force-quit clears. Try Again renders the app afresh; Send Us an Email
 * writes to the team, since the problem report is a screen and every screen
 * is gone.
 *
 * A screen that fails to render is caught sooner, by the boundary Expo Router
 * puts around each screen, which shows `ScreenErrorFallback`;
 * this one is left the failures outside any screen.
 */
export function RootErrorBoundary({children}: {children: React.ReactNode}): React.ReactNode {
	return (
		<Sentry.GlobalErrorBoundary
			fallback={(error) => (
				<ErrorFallback
					actions={[
						{label: 'Try Again', onPress: () => error.resetError()},
						{label: 'Send Us an Email', onPress: openEmail},
					]}
					message="All About Olaf hit an error. Trying again often clears it; if it doesn’t, close and reopen the app."
				/>
			)}
		>
			{children}
		</Sentry.GlobalErrorBoundary>
	)
}
