import * as React from 'react'
import {List, Section, Text} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'

import {CARD_INSET} from '../../components/place-card/card-style'
import type {BuildingType} from '../building-hours/types'
import {CardHours, CloseButton, PlaceCard} from './building-info'
import {LinkListSection} from './card/link-list-section'
import type {SheetDetent} from './lib/sheet-moves'
import type {LabelLink} from './types'

/// A venue's kind, as its card's subtitle names it.
const KIND_WORD = {building: 'Building', office: 'Office', space: 'Space', service: 'Service'}

/// The formal name sits straight under the header, as the Hours sheet sets it.
const FORMAL_NAME_ROW = [
	font({textStyle: 'subheadline', weight: 'semibold'}),
	foregroundStyle({type: 'hierarchical', style: 'secondary'}),
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 0, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

/**
 * An office's or space's card, stacked over the card of the place it is in:
 * its name, what kind of place it is and where, its hours, and its links. A
 * venue not in the Hours data -- still loading, or since renamed -- says so.
 */
export function VenueCard({
	venue,
	placeName,
	extraLinks,
	onClose,
	stop,
}: {
	venue: BuildingType | undefined
	/// The place the venue is in, if the map has it.
	placeName: string | null
	/// The page of a Departments or Offices tile merged with this venue.
	extraLinks?: Array<LabelLink>
	onClose: () => void
	stop: SheetDetent
}): React.ReactNode {
	if (!venue) {
		return (
			<List>
				<Section>
					<Text>Place not found.</Text>
					<CloseButton onClose={onClose} />
				</Section>
			</List>
		)
	}

	let subtitle = [venue.kind ? KIND_WORD[venue.kind] : null, placeName].filter(Boolean).join(' · ')
	// A venue is listed under the name people say; this spells it out, as the
	// Hours sheet does.
	let formalName = venue.subtitle ?? (venue.abbreviation ? `(${venue.abbreviation})` : null)
	let links = [
		...(venue.links ?? []).map(({title, url}) => ({label: title, href: url})),
		...(extraLinks ?? []),
	]

	return (
		<PlaceCard name={venue.name} onClose={onClose} stop={stop} subtitle={subtitle || null}>
			{formalName ? (
				<Section>
					<Text modifiers={FORMAL_NAME_ROW}>{formalName}</Text>
				</Section>
			) : null}
			<CardHours venue={venue} />
			<LinkListSection items={links} title="Links" />
		</PlaceCard>
	)
}
