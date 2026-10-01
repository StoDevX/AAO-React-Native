import * as React from 'react'
import {StyleSheet, type StyleProp, type ViewStyle} from 'react-native'
import {Button, ContentUnavailableView, Host} from '@expo/ui/swift-ui'
import {buttonStyle, controlSize, disabled} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/** What a reader can do about the notice: retry, most often. */
export type NoticeAction = {
	label: string
	onPress: () => void
	disabled?: boolean
}

type Props = {
	/** A few words for what is wrong, set as the system sets a title. */
	title: string
	/** The longer explanation under the title. */
	description?: string
	systemImage?: React.ComponentProps<typeof ContentUnavailableView>['systemImage']
	action?: NoticeAction
	style?: StyleProp<ViewStyle>
	/** Set where the notice sits on a fixed backdrop, as the image viewer's black. */
	colorScheme?: 'light' | 'dark'
}

/**
 * A screen's whole content when it has nothing to show: SwiftUI's
 * `ContentUnavailableView`, with the action, if any, under the description.
 */
export function NoticeView({
	title,
	description,
	systemImage,
	action,
	style,
	colorScheme,
}: Props): React.ReactNode {
	return (
		<Host colorScheme={colorScheme} style={[styles.host, style]}>
			<ContentUnavailableView
				actions={
					action ? (
						<Button
							label={action.label}
							modifiers={[
								buttonStyle('bordered'),
								controlSize('large'),
								disabled(action.disabled ?? false),
							]}
							onPress={action.onPress}
						/>
					) : undefined
				}
				description={description}
				systemImage={systemImage}
				title={title}
			/>
		</Host>
	)
}

/** An error's message as a reader can be shown it. */
export function describeError(error: unknown): string {
	if (error instanceof Error && error.message) return error.message
	if (typeof error === 'string' && error) return error
	return 'Something went wrong.'
}

/** A load that failed with nothing saved to show instead, and a way to try it again. */
export function LoadErrorView({
	error,
	onRetry,
	title = 'Couldn’t Load',
	style,
	colorScheme,
}: {
	error: unknown
	onRetry: () => void
	title?: string
	style?: StyleProp<ViewStyle>
	colorScheme?: 'light' | 'dark'
}): React.ReactNode {
	return (
		<NoticeView
			action={{label: 'Try Again', onPress: onRetry}}
			colorScheme={colorScheme}
			style={style}
			description={describeError(error)}
			systemImage="exclamationmark.triangle"
			title={title}
		/>
	)
}
