import * as React from 'react'
import {useWindowDimensions} from 'react-native'
import {HStack, ScrollView, Text, VStack} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	padding,
	scrollTargetBehavior,
	scrollTargetLayout,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

/** The gap between cards, and from the row's edge to the first. */
const CARD_GAP = 12
const CARD_MARGIN = 16
/** The inset a `Form` section gives its rows on each side. */
const SECTION_MARGIN = 16
const CARD_RADIUS = 16
const CARD_PADDING = 16

/// A row with nothing of a row's own: no fill, margins or divider.
const BARE_ROW = [
	listRowBackground('clear'),
	listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
	listRowSeparator('hidden'),
]

const cardShape = shapes.roundedRectangle({
	cornerRadius: CARD_RADIUS,
	roundedCornerStyle: 'continuous',
})

/** One card: a heading over a body of text. */
export type Card = {
	id: string
	heading: string
	body: string
}

/**
 * A row of cards that scrolls sideways and comes to rest on a card's edge.
 *
 * Fills a `Form` row, clearing the row's own fill and insets.
 */
export function CardCarousel({cards}: {cards: Array<Card>}): React.ReactNode {
	let {width} = useWindowDimensions()
	// One card fills the section, so each snap shows a single card.
	let cardWidth = width - (SECTION_MARGIN + CARD_MARGIN) * 2

	return (
		<ScrollView
			axes="horizontal"
			modifiers={[scrollTargetBehavior('viewAligned'), ...BARE_ROW]}
			showsIndicators={false}
		>
			<HStack
				alignment="top"
				modifiers={[scrollTargetLayout(), padding({horizontal: CARD_MARGIN})]}
				spacing={CARD_GAP}
			>
				{cards.map((card) => (
					<VStack
						alignment="leading"
						key={card.id}
						modifiers={[
							padding({all: CARD_PADDING}),
							frame({width: cardWidth, maxHeight: Infinity, alignment: 'topLeading'}),
							background(c.secondarySystemGroupedBackground, cardShape),
						]}
						spacing={8}
					>
						<Text modifiers={[font({textStyle: 'headline'}), foregroundStyle(c.label)]}>
							{card.heading}
						</Text>
						<Text modifiers={[font({textStyle: 'body'}), foregroundStyle(c.secondaryLabel)]}>
							{card.body}
						</Text>
					</VStack>
				))}
			</HStack>
		</ScrollView>
	)
}
