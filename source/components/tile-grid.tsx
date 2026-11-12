import * as React from 'react'
import {Platform, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Grid, Spacer} from '@expo/ui/swift-ui'
import {accessibilityElement, accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {columnsForFontScale, inRows, SCREEN_MARGIN, TILE_SPACING} from './tile-layout'

/// The number of columns a tile grid has at the current Dynamic Type size.
export function useTileColumns(): number {
	let {fontScale} = useWindowDimensions()
	return columnsForFontScale(fontScale)
}

/// The width of one tile in a full-screen grid of `columns`, inset by
/// `SCREEN_MARGIN` on each side. `@expo/ui` has no `LazyVGrid`, and a `Grid`
/// sizes a cell to its content -- so a lone tile in a short row would fill the
/// screen. A grid pins every tile to this width instead.
export function useTileWidth(columns: number): number {
	let {width: screenWidth} = useWindowDimensions()
	// SwiftUI's `ScrollView` keeps its content inside the safe area, so in
	// landscape the columns share the width left once the notch's side insets
	// are taken -- the grid's own padding is only the screen margin.
	let insets = useSafeAreaInsets()
	let contentWidth = screenWidth - insets.left - insets.right
	return (contentWidth - 2 * SCREEN_MARGIN - (columns - 1) * TILE_SPACING) / columns
}

/**
 * The width of one tile in the enclosing `TileGrid`, for a tile that sizes
 * itself rather than filling its cell: Android's, whose Compose cell does not
 * hand its width on to a fill-and-aspect-ratio card. Null outside a grid.
 */
export const TileWidthContext = React.createContext<number | null>(null)

/** Provides the tile width on Android, where `GradientTile` sizes its card from it. */
function AndroidTileWidth({
	columns,
	children,
}: {
	columns: number
	children: React.ReactNode
}): React.ReactNode {
	let tileWidth = useTileWidth(columns)
	return <TileWidthContext.Provider value={tileWidth}>{children}</TileWidthContext.Provider>
}

/** iOS sizes its tiles in SwiftUI, from the column's width, so it needs no width here. */
function NoTileWidth({children}: {columns?: number; children: React.ReactNode}): React.ReactNode {
	return children
}

const TileWidthProvider = Platform.OS === 'android' ? AndroidTileWidth : NoTileWidth

type Props<T> = {
	items: T[]
	keyForItem: (item: T) => React.Key
	renderItem: (item: T) => React.ReactNode
	/** Overrides `useTileColumns()` for a grid whose tiles are a different size. */
	columns?: number
	/** Names the grid for a UI test counting the tiles inside it. */
	accessibilityId: string
}

/// Tiles laid out in rows of `columns`, or of `useTileColumns()` when the
/// caller gives none. The layout around the grid -- list-row modifiers, a
/// scroll view, padding -- stays with the caller.
export function TileGrid<T>({
	items,
	keyForItem,
	renderItem,
	accessibilityId,
	columns: columnsOverride,
}: Props<T>): React.ReactNode {
	let dynamicColumns = useTileColumns()
	let columns = columnsOverride ?? dynamicColumns

	return (
		<TileWidthProvider columns={columns}>
			<Grid
				alignment="top"
				horizontalSpacing={TILE_SPACING}
				// The Grid itself carries no accessibility presence of its own, so
				// accessibilityIdentifier alone lands on its first button descendant
				// instead of the grid -- contain() gives it one, keeping the tiles as
				// its individually-navigable children, which is what a UI test
				// counting them needs.
				modifiers={[accessibilityElement('contain'), accessibilityIdentifier(accessibilityId)]}
				verticalSpacing={TILE_SPACING}
			>
				{inRows(items, columns).map((row, i) => (
					// oxlint-disable-next-line react/no-array-index-key -- a row is its position; tiles are keyed by the caller
					<Grid.Row key={i}>
						{row.map((item) => (
							<React.Fragment key={keyForItem(item)}>{renderItem(item)}</React.Fragment>
						))}
						{/* A short last row leaves its columns empty rather than
					    stretching the tiles in it. The column count changes with
					    the text size, so a grid that divides evenly at one size
					    can leave a short row at another. */}
						{Array.from({length: columns - row.length}, (_, j) => (
							<Spacer key={j} />
						))}
					</Grid.Row>
				))}
			</Grid>
		</TileWidthProvider>
	)
}
