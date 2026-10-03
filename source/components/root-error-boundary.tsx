import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import * as Sentry from '@sentry/react-native'
import * as c from '@frogpond/colors'

/**
 * What the listener sees when the app fails to render. It stands outside
 * every provider, since a provider may be what failed, so it draws itself from
 * plain views and system colours alone.
 */
function ErrorFallback({retry}: {retry: () => void}): React.ReactNode {
	return (
		<View style={styles.screen}>
			<Text accessibilityRole="header" style={styles.title}>
				Something went wrong
			</Text>
			<Text style={styles.message}>
				All About Olaf hit an error. Trying again often clears it; if it doesn’t, close and reopen
				the app.
			</Text>
			<Pressable
				accessibilityLabel="Try Again"
				accessibilityRole="button"
				onPress={retry}
				style={styles.button}
			>
				<Text style={styles.buttonText}>Try Again</Text>
			</Pressable>
		</View>
	)
}

/**
 * Catches an error anywhere in the app, rendering or fatal, reports it to
 * Sentry, and shows `ErrorFallback` in place of a blank screen that only a
 * force-quit clears. Try Again renders the app afresh.
 */
export function RootErrorBoundary({children}: {children: React.ReactNode}): React.ReactNode {
	return (
		<Sentry.GlobalErrorBoundary
			fallback={(error) => <ErrorFallback retry={() => error.resetError()} />}
		>
			{children}
		</Sentry.GlobalErrorBoundary>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
		paddingHorizontal: 32,
		backgroundColor: c.systemBackground,
	},
	title: {fontSize: 22, fontWeight: '600', color: c.label, textAlign: 'center'},
	message: {fontSize: 17, color: c.secondaryLabel, textAlign: 'center'},
	button: {
		minWidth: 44,
		minHeight: 44,
		justifyContent: 'center',
		paddingHorizontal: 24,
		borderRadius: 22,
		backgroundColor: c.systemBlue,
	},
	buttonText: {fontSize: 17, fontWeight: '600', color: c.white},
})
