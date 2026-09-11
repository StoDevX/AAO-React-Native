import * as React from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Grid, Host, ScrollView, Spacer, Text as UIText, VStack} from '@expo/ui/swift-ui'
import {font, frame, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {FILL_WIDTH, SCREEN_MARGIN} from '../home/button'
import {columnsForFontScale, inRows, TILE_SPACING} from './tile-layout'
import {PersonTile} from './person-tile'
import type {DirectoryItem} from './types'

/// Mirrored by TestIdentifiers.Directory.tilePrefix.
const TILE_PREFIX = 'directory-tile-'

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
	let {width: screenWidth, fontScale} = useWindowDimensions()
	// The SwiftUI `ScrollView` fills the `Host` edge to edge, so in landscape
	// the outer columns would sit under the notch / home indicator without this.
	let insets = useSafeAreaInsets()
	let leadingInset = SCREEN_MARGIN + insets.left
	let trailingInset = SCREEN_MARGIN + insets.right

	let columns = columnsForFontScale(fontScale)
	// `@expo/ui` has no `LazyVGrid`, and a `Grid` sizes a cell to its content --
	// so a lone tile in a short row would fill the screen. Pin every tile to a
	// column's width instead.
	let tileWidth =
		(screenWidth - leadingInset - trailingInset - (columns - 1) * TILE_SPACING) / columns

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
						padding({leading: leadingInset, trailing: trailingInset, top: SCREEN_MARGIN}),
						frame({maxWidth: FILL_WIDTH}),
					]}
					spacing={TILE_SPACING}
				>
					{heading ? <UIText modifiers={[font({textStyle: 'headline'})]}>{heading}</UIText> : null}

					<Grid
						alignment="topLeading"
						horizontalSpacing={TILE_SPACING}
						verticalSpacing={TILE_SPACING}
					>
						{inRows(indexed, columns).map((row, i) => (
							<Grid.Row key={i}>
								{row.map(({person, index}) => (
									<PersonTile
										key={index}
										onPress={() => onSelectIndex(index)}
										person={person}
										testID={`${TILE_PREFIX}${index}`}
										width={tileWidth}
									/>
								))}
								{Array.from({length: columns - row.length}, (_, j) => (
									<Spacer key={j} />
								))}
							</Grid.Row>
						))}
					</Grid>
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
