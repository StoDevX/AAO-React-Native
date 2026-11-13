import * as React from 'react'
import {Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, padding} from '@expo/ui/swift-ui/modifiers'
import {HorizontalPager} from '@expo/ui/jetpack-compose'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'

import type {Card} from './card-carousel'
import {PageDots} from './page-dots'

/** The space between a page's text and the row's edges, as a list row has. */
const PAGE_INSET = 16

/**
 * `PagedSection` on Android: the cards in a Compose `HorizontalPager`, each a
 * full row wide, so a card's text wraps within it. The iOS section sizes its
 * pages with SwiftUI's `containerRelativeFrame`, which Compose has no
 * counterpart to; without it a card's text ran on one line past the row's
 * edge.
 */
export function PagedSection({title, cards}: {title: string; cards: Array<Card>}): React.ReactNode {
	let [shown, setShown] = React.useState(0)

	return (
		<SheetSection footer={<PageDots count={cards.length} shown={shown} />} title={title}>
			<HorizontalPager onSettledPageChange={setShown}>
				{cards.map((card) => (
					<VStack
						alignment="leading"
						key={card.id}
						modifiers={[padding({horizontal: PAGE_INSET, vertical: PAGE_INSET})]}
						spacing={8}
					>
						<Text modifiers={[font({textStyle: 'headline'}), foregroundStyle(c.label)]}>
							{card.heading}
						</Text>
						<Text modifiers={[foregroundStyle(c.label)]}>{card.body}</Text>
					</VStack>
				))}
			</HorizontalPager>
		</SheetSection>
	)
}
