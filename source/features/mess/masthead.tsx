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

const MASTHEAD = [
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

/** The line that says what a page holds, across the column: "April 29, 2026 · 35 stories". */
export function Dateline({text}: {text: string}): React.ReactNode {
	return <Text modifiers={DATELINE}>{text}</Text>
}

type MastheadProps = {
	dateline?: string
	/** Drawn between the rule and the dateline: Top's banner for a newer special edition */
	banner?: React.ReactNode
}

/** The paper's name across the top of the front page, a rule under it, then the dateline; they scroll with the page. */
export function Masthead({dateline, banner}: MastheadProps): React.ReactNode {
	return (
		<VStack spacing={6}>
			<Text modifiers={MASTHEAD}>{OLAF_MESSENGER.title}</Text>
			<Divider />
			{banner}
			{dateline ? <Dateline text={dateline} /> : null}
		</VStack>
	)
}
