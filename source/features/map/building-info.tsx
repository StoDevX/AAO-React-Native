import * as React from 'react'
import {Button, Image, List, Section, Spacer, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonBorderShape,
	buttonStyle,
	dynamicTypeSize,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	listStyle,
	multilineTextAlignment,
	onGeometryChange,
	padding,
	scrollContentBackground,
	truncationMode,
} from '@expo/ui/swift-ui/modifiers'
import {PlaceCardHeader, PlaceCardScaffold} from '@frogpond/place-card-header'

import {FILL_WIDTH} from '../../components/tile-layout'
import {AboutSection} from './card/about-section'
import {ActionsRow} from './card/actions-row'
import {DetailsSection} from './card/details-section'
import {GoodToKnowSection} from './card/good-to-know-section'
import {LinkListSection} from './card/link-list-section'
import {PhotoStrip} from './card/photo-strip'
import {PlacesSection} from './card/places-section'
import {cardActions, WALKING_DIRECTIONS} from './lib/card-actions'
import {nameUnderHeader, titleMayMove} from './lib/card-title'
import {goodToKnowRows} from './lib/good-to-know'
import {placeTiles} from './lib/place-tiles'
import type {SheetDetent} from './lib/sheet-moves'
import type {Building, Coordinate, Feature, Point} from './types'

/// Apple Maps' place-card header, measured on iOS 27: 16pt of padding round
/// 44pt buttons -- 76pt in all, the sheet's collapsed stop
/// (`SHEET_COLLAPSED_HEIGHT` in `Map/index.tsx`).
const HEADER_PADDING = 16

/// The header's bottom padding at the large stop, which puts its edge 12pt
/// under the buttons, where Maps' is. Maps' big title starts 8pt under the
/// buttons, 4pt up under that edge; the scaffold lifts the list to match.
const LARGE_HEADER_BOTTOM_PADDING = 12

/// Maps' header buttons are 44pt square, and the header's title row is as
/// tall as they are.
const BUTTON_SIZE = 44

/// How far the header's small title keeps from each edge of the header: the
/// close button plus `HEADER_PADDING`, so the title clears it.
const TITLE_INSET = BUTTON_SIZE + HEADER_PADDING

/// Glass pads its label about 7pt on every side (measured on iOS 27), so a
/// 30pt frame round the glyph comes out as Maps' 44pt button.
const CLOSE_GLYPH_FRAME = 30
const CLOSE_GLYPH_SIZE = 22

/// The card's own dismiss button. The search bar's Cancel carries the same
/// "Close" accessibility label, so a screen-wide query for that label could
/// answer for either; this testID scopes a test to the card alone. Matches
/// `TestIdentifiers.Map.cardCloseButton` in `TestIdentifiers.swift`.
const CARD_CLOSE_BUTTON_ID = 'card-close-button'

/// The header's title. Matches `TestIdentifiers.Map.cardTitle` in
/// `TestIdentifiers.swift`.
const CARD_TITLE_ID = 'card-title'

/// The big title's subtitle at the large stop.
const CARD_BIG_SUBTITLE_ID = 'card-big-subtitle'

type Props = {
	building: Feature<Building> | undefined
	onClose: () => void
	/// Which stop the sheet is at: large lays the name out differently, and only the other two let a long one move.
	stop: SheetDetent
}

/// The info card's contents, as SwiftUI. The sheet that presents them belongs
/// to the map screen, which swaps between this and the picker.
export function BuildingInfo({building, onClose, stop}: Props): React.ReactNode {
	if (!building) {
		return (
			<List>
				<Section>
					<Text>Building not found.</Text>
					<CloseButton onClose={onClose} />
				</Section>
			</List>
		)
	}

	// A new building starts over with its big title in view.
	return <BuildingCard building={building} key={building.id} onClose={onClose} stop={stop} />
}

/// A found building's card: the pinned header over the list of its details.
function BuildingCard({
	building,
	onClose,
	stop,
}: {
	building: Feature<Building>
	onClose: () => void
	stop: SheetDetent
}): React.ReactNode {
	let large = stop === 'large'
	// Both edges are in window coordinates, so comparing them is exact at any
	// stop and text size. Each is kept as it reports and the verdict derived
	// here, so whichever of the two frames arrives last decides it.
	let [nameBottom, setNameBottom] = React.useState<number | null>(null)
	let [headerBottom, setHeaderBottom] = React.useState<number | null>(null)
	// The name's edge outlives a trip off the large stop on purpose: the list
	// keeps its scroll, and a name scrolled out of view reports no new frame
	// when the list is laid out again, so the last edge is still the answer.
	let bigTitleAway = large && nameUnderHeader(nameBottom, headerBottom)

	let measureBigTitle = (box: {y: number; height: number}) => {
		setNameBottom(box.y + box.height)
	}

	let {address, description, floors, links, name, photos} = building.properties
	let tiles = placeTiles(building.properties)
	let departmentTiles = tiles.filter((tile) => tile.kind === 'department')
	let officeTiles = tiles.filter((tile) => tile.kind === 'office')

	let subtitle = building.properties.type || null

	return (
		<PlaceCardScaffold large={large}>
			<ZStack
				alignment="topTrailing"
				modifiers={[
					// At large Maps sets the big title 8pt under the buttons, so
					// the header ends there.
					padding({
						top: HEADER_PADDING,
						horizontal: HEADER_PADDING,
						bottom: large ? LARGE_HEADER_BOTTOM_PADDING : HEADER_PADDING,
					}),
					// At every stop, though only large uses it: adding or dropping a
					// modifier rebuilds the stack's children in SwiftUI, which would
					// restart the title's marquee on every trip to large.
					onGeometryChange((box) => setHeaderBottom(box.y + box.height)),
				]}
			>
				{large ? (
					bigTitleAway ? (
						// Maps' inline title at large: an ellipsis, no marquee, no
						// subtitle, clear of the button at the trailing edge. Maps
						// stops it growing at about xxxLarge, so the header keeps
						// to the buttons' row and does not jump taller at the swap.
						<Text
							modifiers={[
								font({textStyle: 'title3', weight: 'bold'}),
								dynamicTypeSize({max: 'xxxLarge'}),
								lineLimit(1),
								truncationMode('tail'),
								padding({horizontal: TITLE_INSET}),
								frame({maxWidth: FILL_WIDTH, minHeight: BUTTON_SIZE}),
							]}
						>
							{name}
						</Text>
					) : (
						<Spacer modifiers={[frame({height: BUTTON_SIZE})]} />
					)
				) : null}
				{/* Mounted at every stop, hidden at large, so its marquee keeps
				    one clock across stop changes as Maps' does. */}
				<PlaceCardHeader
					animate={titleMayMove(stop)}
					hidden={large}
					subtitle={subtitle}
					testID={CARD_TITLE_ID}
					title={name}
				/>
				<CloseButton onClose={onClose} />
			</ZStack>

			{/* Plain, on the sheet's own colour: Maps lays its sections straight
			    on the card, not in rounded row boxes. */}
			<List modifiers={[listStyle('plain'), scrollContentBackground('hidden')]}>
				{large ? (
					<Section
						modifiers={[
							// Straight on the sheet, as Maps draws it, not in a row's
							// rounded box, and with no hairline under it.
							listRowBackground('clear'),
							listRowSeparator('hidden'),
							listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
						]}
					>
						{/* Maps sets the subtitle straight under the name. */}
						<VStack modifiers={[frame({maxWidth: FILL_WIDTH})]} spacing={0}>
							{/* The name alone is measured, not the subtitle under it:
							    Maps swaps titles once the name has gone under the
							    header, with the subtitle still in view. */}
							<Text
								modifiers={[
									font({textStyle: 'title', weight: 'bold'}),
									multilineTextAlignment('center'),
									onGeometryChange(measureBigTitle),
								]}
							>
								{name}
							</Text>
							{subtitle ? (
								<Text
									modifiers={[
										font({textStyle: 'subheadline', weight: 'semibold'}),
										foregroundStyle({type: 'hierarchical', style: 'secondary'}),
									]}
									testID={CARD_BIG_SUBTITLE_ID}
								>
									{subtitle}
								</Text>
							) : null}
						</VStack>
					</Section>
				) : null}

				<ActionsRow
					actions={cardActions({point: pointOf(building), walkingDirections: WALKING_DIRECTIONS})}
				/>
				<PhotoStrip name={name} photos={photos} />
				<AboutSection text={description} />
				<GoodToKnowSection rows={goodToKnowRows(building.properties)} />
				<PlacesSection id="departments" tiles={departmentTiles} title="Departments" />
				<PlacesSection id="offices" tiles={officeTiles} title="Offices" />
				<LinkListSection items={floors} title="Floors" />
				<LinkListSection items={links} title="Links" />
				<DetailsSection address={address} />
			</List>
		</PlaceCardScaffold>
	)
}

/// Maps' close button: a glass circle holding a plain xmark.
function CloseButton({onClose}: {onClose: () => void}): React.ReactNode {
	return (
		<Button
			modifiers={[
				accessibilityLabel('Close'),
				buttonStyle('glass'),
				buttonBorderShape('circle'),
				// Maps' button and glyph stay the same size at every text size;
				// without this the glass padding grows and squeezes the glyph.
				dynamicTypeSize({max: 'large'}),
			]}
			onPress={onClose}
			testID={CARD_CLOSE_BUTTON_ID}
		>
			<Image
				modifiers={[frame({width: CLOSE_GLYPH_FRAME, height: CLOSE_GLYPH_FRAME})]}
				size={CLOSE_GLYPH_SIZE}
				systemName="xmark"
			/>
		</Button>
	)
}

/// Where Directions routes: the building's map point, if the feed gives one.
function pointOf(building: Feature<Building>): Coordinate | null {
	let point = building.geometry.geometries.find((geo): geo is Point => geo.type === 'Point')
	return point?.coordinates ?? null
}
