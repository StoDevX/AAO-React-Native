import * as React from 'react'
import {Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import {PlaceCardAbout} from '@frogpond/place-card-header'

import {citationLine} from '../lib/citations'
import type {LabelLink} from '../types'
import {openURLAction} from '../../../lib/open-url-action'
import {CARD_INSET} from '../../../components/place-card/card-style'
import {SectionHeading} from '../../../components/place-card/section-heading'

/// The About text sits straight under its heading, with nothing drawn between.
const TEXT_ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 8, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

/// The Sources line: fine print under the text, its links opened as every
/// other card link is, honouring the reader's in-app-browser setting.
///
/// Each source is an inline link, smaller than AGENTS.md's 44pt touch target.
/// Wren approved that exception for this line on 2026-09-30, to keep sources
/// compact; VoiceOver reaches each link through the Links rotor.
const SOURCES_ROW = [
	...TEXT_ROW,
	font({textStyle: 'footnote'}),
	foregroundStyle({type: 'hierarchical', style: 'secondary'}),
	openURLAction(openUrl),
]

/// The building's description under an About heading, clamped as Maps clamps
/// it, and the sources it is drawn from.
export function AboutSection({
	text,
	citations,
}: {
	text: string | undefined
	citations?: Array<LabelLink> | null
}): React.ReactNode {
	// The feed is not validated at the boundary, so a record can omit it.
	// Trimmed, because a trailing blank line counts as a line of its own and
	// could earn a short description a MORE with nothing behind it.
	let trimmed = text?.trim()
	if (!trimmed) {
		return null
	}
	let sources = citationLine(citations)
	return (
		<Section>
			<SectionHeading title="About" />
			{/* The native view takes no list modifiers of its own. */}
			<VStack modifiers={TEXT_ROW}>
				<PlaceCardAbout testID="card-about" text={trimmed} />
			</VStack>
			{sources ? (
				<Text markdownEnabled={true} modifiers={SOURCES_ROW} testID="card-sources">
					{sources}
				</Text>
			) : null}
		</Section>
	)
}
