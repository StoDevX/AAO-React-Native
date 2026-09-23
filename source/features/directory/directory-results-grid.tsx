import * as React from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Host, ScrollView, Text as UIText, VStack} from '@expo/ui/swift-ui'
import {font, frame, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {TileGrid, useTileColumns} from '../../components/tile-grid'
import {FILL_WIDTH, SCREEN_MARGIN, TILE_SPACING} from '../../components/tile-layout'
import {PersonTile} from './person-tile'
import type {DirectoryItem} from './types'

/// Mirrored by TestIdentifiers.Directory.tilePrefix.
const TILE_PREFIX = 'directory-tile-'
const RESULTS_GRID_ID = 'directory-results-grid'

type Props = {
	items: DirectoryItem[]
	/** The name over the results, when the search was opened from something named. */
	heading: string | null
	onSelectIndex: (index: number) => void
	// The SwiftUI `refreshable` modifier owns its own spinner, so there is no
	// `refreshing` flag to pass alongside this.
	onRefresh: () => Promise<unknown>
}

export function DirectoryResultsGrid({
	items,
	heading,
	onSelectIndex,
	onRefresh,
}: Props): React.ReactNode {
	let {width: screenWidth} = useWindowDimensions()
	// SwiftUI's `ScrollView` keeps its content inside the safe area, so in
	// landscape the columns share the width left once the notch's side insets
	// are taken -- the padding below is only the screen margin.
	let insets = useSafeAreaInsets()
	let contentWidth = screenWidth - insets.left - insets.right

	let columns = useTileColumns()
	// `@expo/ui` has no `LazyVGrid`, and a `Grid` sizes a cell to its content --
	// so a lone tile in a short row would fill the screen. Pin every tile to a
	// column's width instead.
	let tileWidth = (contentWidth - 2 * SCREEN_MARGIN - (columns - 1) * TILE_SPACING) / columns

	let indexed = items.map((person, index) => ({person, index}))

	return (
		<Host matchContents={false} style={styles.host}>
			<ScrollView
				modifiers={[
					refreshable(async () => {
						await onRefresh()
					}),
				]}
			>
				<VStack
					alignment="leading"
					modifiers={[
						padding({leading: SCREEN_MARGIN, trailing: SCREEN_MARGIN, top: SCREEN_MARGIN}),
						frame({maxWidth: FILL_WIDTH}),
					]}
					spacing={TILE_SPACING}
				>
					{heading ? <UIText modifiers={[font({textStyle: 'headline'})]}>{heading}</UIText> : null}

					<TileGrid
						accessibilityId={RESULTS_GRID_ID}
						// The tile width above is worked out from this count, so the
						// grid takes it rather than working out its own.
						columns={columns}
						items={indexed}
						keyForItem={({index}) => index}
						renderItem={({person, index}) => (
							<PersonTile
								onPress={() => onSelectIndex(index)}
								person={person}
								testID={`${TILE_PREFIX}${index}`}
								width={tileWidth}
							/>
						)}
					/>
				</VStack>
			</ScrollView>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
})
