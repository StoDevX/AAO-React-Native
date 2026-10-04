import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'

/** A button on the error screen. */
export type ErrorFallbackAction = {label: string; onPress: () => void}

/**
 * What the listener sees in place of something that failed to render. The
 * root boundary draws it outside every provider, since a provider may be what
 * failed, so it draws itself from plain views and system colours alone.
 *
 * The first action is drawn filled, as the one to reach for; any others are
 * drawn as plain tinted text beneath it.
 */
export function ErrorFallback({
	message,
	actions,
}: {
	message: string
	actions: ReadonlyArray<ErrorFallbackAction>
}): React.ReactNode {
	return (
		<View style={styles.screen}>
			<Text accessibilityRole="header" style={styles.title}>
				Something went wrong
			</Text>
			<Text style={styles.message}>{message}</Text>
			{actions.map((action, index) => (
				<Pressable
					accessibilityLabel={action.label}
					accessibilityRole="button"
					key={action.label}
					onPress={action.onPress}
					style={index === 0 ? styles.primaryButton : styles.secondaryButton}
				>
					<Text style={index === 0 ? styles.primaryText : styles.secondaryText}>
						{action.label}
					</Text>
				</Pressable>
			))}
		</View>
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
	primaryButton: {
		minWidth: 44,
		minHeight: 44,
		justifyContent: 'center',
		paddingHorizontal: 24,
		borderRadius: 22,
		backgroundColor: c.systemBlue,
	},
	primaryText: {fontSize: 17, fontWeight: '600', color: c.white},
	secondaryButton: {
		minWidth: 44,
		minHeight: 44,
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	secondaryText: {fontSize: 17, color: c.systemBlue},
})
