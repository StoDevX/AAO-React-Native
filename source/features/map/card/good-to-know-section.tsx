import * as React from 'react'
import {HStack, Image, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	imageScale,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'

import type {GoodToKnowRow} from '../lib/good-to-know'
import {CARD_INSET} from './card-style'
import {SectionHeading} from './section-heading'

/// Maps' amenity rows sit close together, with no hairlines between them.
const ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 4, leading: CARD_INSET, bottom: 4, trailing: CARD_INSET}),
]

/// Small, and in a column wide enough for the widest of them, so the texts
/// line up, as Maps' amenity icons are.
const ICON = [imageScale('small'), frame({width: 28})]

const SYMBOL = {
	abbreviation: 'textformat.abc',
	nickname: 'quote.bubble',
	accessibility: 'figure.roll',
} as const satisfies Record<GoodToKnowRow['kind'], string>

/// Facts about the building, each after an icon, as Maps lists a place's amenities.
export function GoodToKnowSection({rows}: {rows: Array<GoodToKnowRow>}): React.ReactNode {
	if (rows.length === 0) {
		return null
	}
	return (
		<Section>
			<SectionHeading title="Good to Know" />
			{rows.map((row) => (
				<HStack key={row.kind} alignment="firstTextBaseline" modifiers={ROW} spacing={12}>
					<Image
						modifiers={[
							...ICON,
							foregroundStyle(
								row.kind === 'accessibility' && !row.accessible
									? {type: 'hierarchical', style: 'secondary'}
									: {type: 'hierarchical', style: 'primary'},
							),
						]}
						systemName={SYMBOL[row.kind]}
					/>
					<VStack alignment="leading" spacing={2}>
						<Text>{row.text}</Text>
						{row.kind === 'nickname'
							? row.others.map((name) => (
									<Text
										key={name}
										modifiers={[
											font({textStyle: 'subheadline'}),
											foregroundStyle({type: 'hierarchical', style: 'secondary'}),
										]}
									>
										{name}
									</Text>
								))
							: null}
					</VStack>
				</HStack>
			))}
		</Section>
	)
}
