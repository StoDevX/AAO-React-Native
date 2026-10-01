import * as React from 'react'
import {StyleSheet, type StyleProp, type ViewStyle} from 'react-native'
import {Host, ProgressView, Text} from '@expo/ui/swift-ui'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/** A screen's whole content while it waits for its first data: a labelled spinner. */
export function LoadingView({
	text = 'Loading…',
	style,
	colorScheme,
}: {
	text?: string
	style?: StyleProp<ViewStyle>
	colorScheme?: 'light' | 'dark'
}): React.ReactNode {
	return (
		<Host colorScheme={colorScheme} style={[styles.host, style]}>
			<ProgressView>
				<Text>{text}</Text>
			</ProgressView>
		</Host>
	)
}
