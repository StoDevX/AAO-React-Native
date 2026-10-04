import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, ScrollView, Text as UIText, VStack} from '@expo/ui/swift-ui'
import {font, frame, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {TileGrid, useTileColumns, useTileWidth} from '../../components/tile-grid'
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
	let columns = useTileColumns()
	let tileWidth = useTileWidth(columns)

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
