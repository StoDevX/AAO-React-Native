import * as React from 'react'
import {Button, ProgressView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	font,
	foregroundStyle,
	frame,
	multilineTextAlignment,
	padding,
	tint,
} from '@expo/ui/swift-ui/modifiers'
import {faded, messRed} from './palette'

const NOTICE = [frame({maxWidth: Infinity}), padding({vertical: 24})]
const MESSAGE = [
	font({textStyle: 'callout'}),
	foregroundStyle(faded),
	multilineTextAlignment('center'),
]
const TRY_AGAIN = [buttonStyle('bordered'), tint(messRed), accessibilityLabel('Try Again')]

/**
 * Stands in for a page's stories while they load. Offline, a query with nothing cached is paused
 * rather than loading, and React Query fetches it once the connection returns, so the page says
 * that instead of spinning until then.
 */
export function PageLoading({paused = false}: {paused?: boolean}): React.ReactNode {
	return paused ? (
		<PageMessage text="No connection. This page loads when you’re back online." />
	) : (
		<VStack modifiers={NOTICE}>
			<ProgressView />
		</VStack>
	)
}

/** A line in place of a page's stories, saying why there are none. */
export function PageMessage({text}: {text: string}): React.ReactNode {
	return (
		<VStack modifiers={NOTICE}>
			<Text modifiers={MESSAGE}>{text}</Text>
		</VStack>
	)
}

/**
 * Says a page's stories failed to load, in the reader notice's words, and offers to try again.
 * Drawn in SwiftUI, inside the page, so the front page's chips stay above it.
 */
export function PageNotice({
	error,
	onRetry,
}: {
	error: Error | null
	onRetry: () => unknown
}): React.ReactNode {
	return (
		<VStack modifiers={NOTICE} spacing={12}>
			<Text modifiers={MESSAGE}>{`A problem occurred while loading: ${error}`}</Text>
			<Button modifiers={TRY_AGAIN} onPress={() => onRetry()}>
				<Text>Try Again</Text>
			</Button>
		</VStack>
	)
}
