import * as React from 'react'
import {Divider, Image, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	font,
	foregroundStyle,
	frame,
	multilineTextAlignment,
	padding,
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
/** The paper's castle in the nameplate's place, read by VoiceOver as the paper's name. */
const PAPER_CASTLE = [
	font({textStyle: 'largeTitle'}),
	foregroundStyle(ink),
	frame({maxWidth: Infinity}),
	// Up into the transparent navigation bar, level with its buttons, so it starts in the header
	// and still scrolls away with the page.
	padding({top: -68}),
	accessibilityLabel(OLAF_MESSENGER.title),
]
const HEADING_PAPER_CASTLE = [...PAPER_CASTLE, accessibilityAddTraits(['isHeader'])]
/** The rule under the castle, drawn up toward it from where the stack would put it. */
const RULE_UNDER_CASTLE = [padding({top: -6})]
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
 * The paper's nameplate, or its castle, and a rule under it, then the page's dateline when it has
 * one; they scroll with the page. The navigation bar has no title, so `heading` names the line
 * VoiceOver reads as the page's heading: the nameplate on the front page, and on an issue's page the
 * dateline, which names the issue. Only one of them is a heading, so the page does not open on two
 * in a row.
 */
export function Masthead({
	castle = false,
	dateline,
	heading = 'nameplate',
}: {
	castle?: boolean
	dateline: string | null
	heading?: 'nameplate' | 'dateline'
}): React.ReactNode {
	return (
		<VStack spacing={6}>
			{castle ? (
				<Image
					assetName="olaf-messenger-castle"
					modifiers={heading === 'nameplate' ? HEADING_PAPER_CASTLE : PAPER_CASTLE}
				/>
			) : (
				<Text modifiers={heading === 'nameplate' ? HEADING_PAPER_NAME : PAPER_NAME}>
					{OLAF_MESSENGER.title}
				</Text>
			)}
			<Divider modifiers={castle ? RULE_UNDER_CASTLE : undefined} />
			{dateline ? <Dateline isHeading={heading === 'dateline'} text={dateline} /> : null}
		</VStack>
	)
}
