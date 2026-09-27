import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack} from 'expo-router'
import {Divider, Host, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityHidden,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	minimumScaleFactor,
	multilineTextAlignment,
	textCase,
} from '@expo/ui/swift-ui/modifiers'
import {OLAF_MESSENGER} from '../news/sources'
import {faded, ink} from './palette'

/** Names a page's dateline, for a UI test. */
export const DATELINE_ID = 'mess-dateline'

/**
 * The paper's name in the navigation bar. A bar keeps its height whatever it holds, so the name
 * shrinks to fit a large text size rather than wrapping or clipping. Hidden from VoiceOver, which
 * reads the bar's own heading for the screen's title instead.
 */
const PAPER_NAME = [
	font({textStyle: 'title3', design: 'serif', weight: 'bold'}),
	foregroundStyle(ink),
	lineLimit(1),
	minimumScaleFactor(0.6),
	accessibilityHidden(true),
]
/** Set in capitals by SwiftUI, so VoiceOver reads the words rather than spelling them. */
const DATELINE = [
	font({textStyle: 'caption', weight: 'semibold'}),
	textCase('uppercase'),
	foregroundStyle(faded),
	multilineTextAlignment('center'),
	frame({maxWidth: Infinity}),
	accessibilityIdentifier(DATELINE_ID),
]

/** The line that says what a page holds, across the column: "April 29, 2026 · 35 stories". */
export function Dateline({text}: {text: string}): React.ReactNode {
	return <Text modifiers={DATELINE}>{text}</Text>
}

/**
 * Sets the paper's name, in its serif, as the screen's navigation bar title. The plain title is
 * what the Back button and VoiceOver's fallback read. Mount it inside the route's own screen.
 */
export function PaperNameTitle(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: OLAF_MESSENGER.title}} />
			<Stack.Title asChild={true}>
				{/* An explicit size rather than `matchContents`: a navigation bar gives its title
				    view no size to match, so a self-sizing host collapses and takes the title with it. */}
				<Host style={styles.paperName}>
					<Text modifiers={PAPER_NAME}>{OLAF_MESSENGER.title}</Text>
				</Host>
			</Stack.Title>
		</>
	)
}

/** A rule across the top of a page, then its dateline; they scroll with the page. */
export function Masthead({dateline}: {dateline: string}): React.ReactNode {
	return (
		<VStack spacing={6}>
			<Divider />
			<Dateline text={dateline} />
		</VStack>
	)
}

const styles = StyleSheet.create({
	// As wide as the bar can give its title beside the Back button, and a bar's height.
	paperName: {
		width: 260,
		height: 44,
	},
})
