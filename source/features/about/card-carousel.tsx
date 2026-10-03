import * as React from 'react'
import {Circle, HStack, ScrollView, Text, VStack, useNativeState} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityLabel,
	accessibilityValue,
	containerRelativeFrame,
	font,
	foregroundStyle,
	frame,
	id,
	listRowInsets,
	padding,
	scrollPosition,
	scrollTargetBehavior,
	scrollTargetLayout,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'

import {HyphenatedText} from '@frogpond/hyphenated-text'

import {cardIndex} from './card-index'

/** The space between a page's text and the row's edges, as a list row has. */
const PAGE_INSET = 16
/** UIPageControl's dot and the gap between dots. */
const DOT_SIZE = 7
const DOT_GAP = 8

/** One card: a heading over a body of text. */
export type Card = {
	id: string
	heading: string
	body: string
}

/**
 * A section whose one row pages sideways, a card at a time across its full
 * width, with dots in the footer saying which card is showing, as a page
 * control does. The dots are the only sign it swipes, so they always show.
 */
export function PagedSection({title, cards}: {title: string; cards: Array<Card>}): React.ReactNode {
	let position = useNativeState<string | null>(cards[0]?.id ?? null)
	let [shownId, setShownId] = React.useState<string | null>(null)
	let shown = cardIndex(cards, shownId)

	let dots = (
		<HStack
			modifiers={[
				frame({maxWidth: Infinity}),
				accessibilityElement('ignore'),
				accessibilityLabel('Page'),
				accessibilityValue(`${shown + 1} of ${cards.length}`),
			]}
			spacing={DOT_GAP}
		>
			{cards.map((card, index) => (
				<Circle
					key={card.id}
					modifiers={[
						frame({width: DOT_SIZE, height: DOT_SIZE}),
						foregroundStyle(index === shown ? c.label : c.tertiaryLabel),
					]}
				/>
			))}
		</HStack>
	)

	return (
		<SheetSection footer={dots} title={title}>
			<ScrollView
				axes="horizontal"
				modifiers={[
					scrollTargetBehavior('paging'),
					scrollPosition(position, {anchor: 'center', onChange: setShownId}),
					listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
				]}
				showsIndicators={false}
			>
				<HStack alignment="top" modifiers={[scrollTargetLayout()]} spacing={0}>
					{cards.map((card) => (
						<VStack
							alignment="leading"
							key={card.id}
							modifiers={[
								id(card.id),
								padding({horizontal: PAGE_INSET, vertical: PAGE_INSET}),
								containerRelativeFrame({axes: 'horizontal', alignment: 'topLeading'}),
							]}
							spacing={8}
						>
							<Text modifiers={[font({textStyle: 'headline'}), foregroundStyle(c.label)]}>
								{card.heading}
							</Text>
							<HyphenatedText text={card.body} />
						</VStack>
					))}
				</HStack>
			</ScrollView>
		</SheetSection>
	)
}
