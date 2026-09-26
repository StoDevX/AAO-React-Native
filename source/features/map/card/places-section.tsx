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
	accessibilityLabel,
	buttonBorderShape,
	buttonStyle,
	font,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	padding,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'

import {CAROUSEL_TILE_LIMIT, type PlaceTile} from '../lib/place-tiles'
import {CARD_INSET} from './card-style'
import {PlaceTileView} from './place-tile'
import {SectionHeading} from './section-heading'

const TILE_SPACING = 12

/// The carousel runs to the sheet's edges, so its row has no insets of its own.
const CAROUSEL_ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 12, leading: 0, bottom: 0, trailing: 0}),
]

/// A tile's identity among its building's: its kind, name and link together.
function tileKey(tile: PlaceTile): string {
	return `${tile.kind}-${tile.label}-${tile.href ?? ''}`
}

/// Pairs of tiles, one pair to each row of the More grid.
function rowsOfTwo(tiles: Array<PlaceTile>): Array<Array<PlaceTile>> {
	let rows: Array<Array<PlaceTile>> = []
	for (let i = 0; i < tiles.length; i += 2) {
		rows.push(tiles.slice(i, i + 2))
	}
	return rows
}

/// A building's departments and offices as a carousel of tiles, after Maps'
/// "Also at This Location". Past six tiles, More opens every one in a grid.
export function PlacesSection({tiles}: {tiles: Array<PlaceTile>}): React.ReactNode {
	let [showingAll, setShowingAll] = React.useState(false)
	if (tiles.length === 0) {
		return null
	}
	let hasMore = tiles.length > CAROUSEL_TILE_LIMIT
	return (
		<Section>
			<SectionHeading
				title="Departments & Offices"
				trailing={
					hasMore ? (
						<Button
							modifiers={[buttonStyle('borderless')]}
							onPress={() => setShowingAll(true)}
							testID="places-more"
						>
							<Text>More</Text>
						</Button>
					) : undefined
				}
			/>
			<ScrollView axes="horizontal" modifiers={CAROUSEL_ROW} showsIndicators={false}>
				<HStack modifiers={[padding({horizontal: CARD_INSET})]} spacing={TILE_SPACING}>
					{tiles.slice(0, CAROUSEL_TILE_LIMIT).map((tile) => (
						<PlaceTileView key={tileKey(tile)} tile={tile} />
					))}
				</HStack>
			</ScrollView>
			{hasMore ? (
				<BottomSheet isPresented={showingAll} onIsPresentedChange={setShowingAll}>
					<VStack modifiers={[presentationDragIndicator('visible')]} spacing={0}>
						<HStack modifiers={[padding({horizontal: CARD_INSET, top: 20, bottom: 12})]}>
							<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>
								Departments & Offices
							</Text>
							<Spacer />
							<Button
								modifiers={[
									buttonStyle('glass'),
									buttonBorderShape('circle'),
									accessibilityLabel('Close'),
								]}
								onPress={() => setShowingAll(false)}
								testID="places-grid-close"
							>
								<Image systemName="xmark" />
							</Button>
						</HStack>
						<ScrollView testID="places-grid">
							<Grid
								horizontalSpacing={TILE_SPACING}
								modifiers={[padding({horizontal: CARD_INSET, bottom: CARD_INSET})]}
								verticalSpacing={TILE_SPACING}
							>
								{rowsOfTwo(tiles).map((row) => (
									<Grid.Row key={row.map(tileKey).join('|')}>
										{row.map((tile) => (
											<PlaceTileView key={tileKey(tile)} fill={true} tile={tile} />
										))}
									</Grid.Row>
								))}
							</Grid>
						</ScrollView>
					</VStack>
				</BottomSheet>
			) : null}
		</Section>
	)
}
