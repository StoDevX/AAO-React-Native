import * as React from 'react'
import {
	BottomSheet,
	Button,
	Grid,
	HStack,
	Image,
	ScrollView,
	Section,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	background,
	buttonBorderShape,
	buttonStyle,
	contentShape,
	font,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	padding,
	presentationDragIndicator,
	shapes,
} from '@expo/ui/swift-ui/modifiers'

import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'

import {splitCarousel, type PlaceTile} from '../lib/place-tiles'
import {CARD_INSET} from '../../../components/place-card/card-style'
import {MoreTileView, PlaceTileView, type TileStatus} from './place-tile'
import type {StackEntry} from '../lib/also-here'
import {STATUS_TEXT} from '../../building-hours/hours-section'
import {
	contextualStatus,
	getShortBuildingStatus,
	hasDisplayableHours,
} from '../../building-hours/lib'
import {SectionHeading} from '../../../components/place-card/section-heading'

const TILE_SPACING = 12

/// Apple's smallest comfortable tap target, in points.
const TAP_TARGET = 44

/// The carousel runs to the sheet's edges, so its row has no insets of its own.
const CAROUSEL_ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 12, leading: 0, bottom: 0, trailing: 0}),
]

/// A tile's identity among its building's. The feed can list one entry twice,
/// so its position goes into the key alongside its kind, name and link.
function tileKey(tile: PlaceTile, index: number): string {
	return `${tile.kind}-${tile.label}-${tile.href ?? ''}-${index}`
}

/// A tile's live status, from its venue's hours; none for a tile with no
/// venue, or a venue with no hours listed.
function statusOf(tile: PlaceTile, now: Moment | undefined): TileStatus | undefined {
	let venue = tile.venue
	if (!now || !venue || !hasDisplayableHours(venue.schedule ?? [])) {
		return undefined
	}
	return {
		text: contextualStatus(venue, now).long,
		color: STATUS_TEXT[getShortBuildingStatus(venue, now)],
	}
}

/// Pairs of tiles, one pair to each row of the More grid.
function rowsOfTwo(tiles: Array<PlaceTile>): Array<Array<PlaceTile>> {
	let rows: Array<Array<PlaceTile>> = []
	for (let i = 0; i < tiles.length; i += 2) {
		rows.push(tiles.slice(i, i + 2))
	}
	return rows
}

/// A carousel of place tiles, after Maps' "Also at This Location": a
/// building's departments, its offices, or what else is there. Past seven
/// tiles, More opens every one in a grid.
/// `id` names the section's controls for tests: `{id}-more`, `{id}-grid`.
export function PlacesSection({
	title,
	id,
	tiles,
	now,
	onOpen,
}: {
	title: string
	id: string
	tiles: Array<PlaceTile>
	/// The time statuses are read at; without it, tiles show no status.
	now?: Moment
	onOpen?: (entry: StackEntry) => void
}): React.ReactNode {
	let [showingAll, setShowingAll] = React.useState(false)
	if (tiles.length === 0) {
		return null
	}
	let {shown, hidden} = splitCarousel(tiles)
	let hasMore = hidden.length > 0
	return (
		<Section>
			<SectionHeading
				title={title}
				trailing={
					hasMore ? (
						// The grid's sheet rides on the heading's row: on its own in
						// the section, the list would give it an empty row.
						<HStack>
							<Button
								modifiers={[
									buttonStyle('borderless'),
									// Named for its section, so VoiceOver tells the two apart.
									accessibilityLabel(`More ${title.toLowerCase()}`),
									accessibilityIdentifier(`${id}-more`),
								]}
								onPress={() => setShowingAll(true)}
							>
								{/* A borderless button answers only where its label draws,
								    so the label takes the 44pt minimum itself. */}
								<Text
									modifiers={[
										frame({minWidth: TAP_TARGET, minHeight: TAP_TARGET, alignment: 'trailing'}),
										contentShape(shapes.rectangle()),
									]}
								>
									More
								</Text>
							</Button>
							<BottomSheet isPresented={showingAll} onIsPresentedChange={setShowingAll}>
								<VStack
									modifiers={[
										presentationDragIndicator('visible'),
										// The card's own grey, so the white tiles stand out on it.
										background(c.systemGroupedBackground),
									]}
									spacing={0}
								>
									<HStack modifiers={[padding({horizontal: CARD_INSET, top: 20, bottom: 12})]}>
										<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>{title}</Text>
										<Spacer />
										<Button
											modifiers={[
												buttonStyle('glass'),
												buttonBorderShape('circle'),
												accessibilityLabel('Close'),
												accessibilityIdentifier(`${id}-grid-close`),
											]}
											onPress={() => setShowingAll(false)}
										>
											<Image systemName="xmark" />
										</Button>
									</HStack>
									<ScrollView modifiers={[accessibilityIdentifier(`${id}-grid`)]}>
										<VStack alignment="leading" spacing={0}>
											<TileGrid now={now} onOpen={onOpen} tiles={tiles} />
										</VStack>
									</ScrollView>
								</VStack>
							</BottomSheet>
						</HStack>
					) : undefined
				}
			/>
			<ScrollView axes="horizontal" modifiers={CAROUSEL_ROW} showsIndicators={false}>
				<HStack modifiers={[padding({horizontal: CARD_INSET})]} spacing={TILE_SPACING}>
					{shown.map((tile, index) => (
						<PlaceTileView
							key={tileKey(tile, index)}
							onOpen={onOpen}
							status={statusOf(tile, now)}
							tile={tile}
						/>
					))}
					{hasMore ? (
						<MoreTileView
							hidden={hidden.map((tile) => tile.label)}
							noun={title.toLowerCase()}
							onPress={() => setShowingAll(true)}
							total={tiles.length}
						/>
					) : null}
				</HStack>
			</ScrollView>
		</Section>
	)
}

/// The More grid's tiles, two to a row.
function TileGrid({
	tiles,
	now,
	onOpen,
}: {
	tiles: Array<PlaceTile>
	now?: Moment
	onOpen?: (entry: StackEntry) => void
}): React.ReactNode {
	return (
		<Grid
			horizontalSpacing={TILE_SPACING}
			modifiers={[padding({horizontal: CARD_INSET, bottom: CARD_INSET})]}
			verticalSpacing={TILE_SPACING}
		>
			{rowsOfTwo(tiles).map((row, rowIndex) => (
				// oxlint-disable-next-line react/no-array-index-key -- a row is a pair of tiles, and its place in the grid is its identity
				<Grid.Row key={rowIndex}>
					{row.map((tile, index) => (
						<PlaceTileView
							key={tileKey(tile, rowIndex * 2 + index)}
							fill={true}
							onOpen={onOpen}
							status={statusOf(tile, now)}
							tile={tile}
						/>
					))}
				</Grid.Row>
			))}
		</Grid>
	)
}
