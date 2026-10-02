import * as React from 'react'
import {Divider, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	frame,
	multilineTextAlignment,
	textCase,
} from '@expo/ui/swift-ui/modifiers'
import {OLAF_MESSENGER} from '../news/sources'
import {faded, ink} from './palette'

/** Names a page's dateline, for a UI test. */
export const DATELINE_ID = 'mess-dateline'

/**
 * The paper's name across the top of the front page, where a printed paper sets its nameplate. It
 * wraps at a large text size rather than shrinking, since the page scrolls. VoiceOver reads it as
 * the page's heading, the navigation bar having no title of its own.
 */
const PAPER_NAME = [
	font({textStyle: 'largeTitle', design: 'serif', weight: 'bold'}),
	foregroundStyle(ink),
	multilineTextAlignment('center'),
	frame({maxWidth: Infinity}),
	accessibilityAddTraits(['isHeader']),
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
const HEADING_DATELINE = [...DATELINE, accessibilityAddTraits(['isHeader'])]

/**
 * The line that says what a page holds, across the column: "April 29, 2026 · 35 stories". Set
 * `isHeading` where it names the page, as on an issue's page, whose bar has no title; under the
 * front page's nameplate it is not a second heading.
 */
export function Dateline({
	text,
	isHeading = false,
}: {
	text: string
	isHeading?: boolean
}): React.ReactNode {
	return <Text modifiers={isHeading ? HEADING_DATELINE : DATELINE}>{text}</Text>
}

/**
 * The paper's nameplate and a rule under it, then the front page's dateline when the page has one;
 * they scroll with the page.
 */
export function Masthead({dateline}: {dateline: string | null}): React.ReactNode {
	return (
		<VStack spacing={6}>
			<Text modifiers={PAPER_NAME}>{OLAF_MESSENGER.title}</Text>
			<Divider />
			{dateline ? <Dateline text={dateline} /> : null}
		</VStack>
	)
}
