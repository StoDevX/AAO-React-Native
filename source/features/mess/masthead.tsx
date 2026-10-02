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
 * The paper's name across the top of a page, where a printed paper sets its nameplate. It wraps at
 * a large text size rather than shrinking, since the page scrolls.
 */
const PAPER_NAME = [
	font({textStyle: 'largeTitle', design: 'serif', weight: 'bold'}),
	foregroundStyle(ink),
	multilineTextAlignment('center'),
	frame({maxWidth: Infinity}),
]
const HEADING_PAPER_NAME = [...PAPER_NAME, accessibilityAddTraits(['isHeader'])]
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

/** The line that says what a page holds, across the column: "April 29, 2026 · 35 stories". */
function Dateline({text, isHeading = false}: {text: string; isHeading?: boolean}): React.ReactNode {
	return <Text modifiers={isHeading ? HEADING_DATELINE : DATELINE}>{text}</Text>
}

/**
 * The paper's nameplate and a rule under it, then the page's dateline when it has one; they scroll
 * with the page. The navigation bar has no title, so `heading` names the line VoiceOver reads as the
 * page's heading: the nameplate on the front page, and on an issue's page the dateline, which names
 * the issue. Only one of them is a heading, so the page does not open on two in a row.
 */
export function Masthead({
	dateline,
	heading = 'nameplate',
}: {
	dateline: string | null
	heading?: 'nameplate' | 'dateline'
}): React.ReactNode {
	return (
		<VStack spacing={6}>
			<Text modifiers={heading === 'nameplate' ? HEADING_PAPER_NAME : PAPER_NAME}>
				{OLAF_MESSENGER.title}
			</Text>
			<Divider />
			{dateline ? <Dateline isHeading={heading === 'dateline'} text={dateline} /> : null}
		</VStack>
	)
}
