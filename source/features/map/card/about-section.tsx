import * as React from 'react'
import {Section, VStack} from '@expo/ui/swift-ui'
import {listRowBackground, listRowInsets, listRowSeparator} from '@expo/ui/swift-ui/modifiers'
import {PlaceCardAbout} from '@frogpond/place-card-header'

import {CARD_INSET} from './card-style'
import {SectionHeading} from './section-heading'

/// The About text sits straight under its heading, with nothing drawn between.
const TEXT_ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 8, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

/// The building's description under an About heading, clamped as Maps clamps it.
export function AboutSection({text}: {text: string}): React.ReactNode {
	if (!text.trim()) {
		return null
	}
	return (
		<Section>
			<SectionHeading title="About" />
			{/* The native view takes no list modifiers of its own. */}
			<VStack modifiers={TEXT_ROW}>
				<PlaceCardAbout text={text} />
			</VStack>
		</Section>
	)
}
