import * as React from 'react'
import {useWindowDimensions} from 'react-native'
import {Button, Circle, Image, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	dynamicTypeSize,
	fixedSize,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	listRowBackground,
	listRowInsets,
	minimumScaleFactor,
	multilineTextAlignment,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {displayP3} from '@frogpond/colors'

import {DisclosureRow} from '../../components/rows'
import {TileGrid} from '../../components/tile-grid'
import {columnsForFontScale, FILL_WIDTH} from '../../components/tile-layout'
import {groupColor, type CategoryGroup} from './lib/category-groups'

/// Names the grid for a UI test counting its tiles.
export const CATEGORY_GRID_ID = 'map-category-grid'

/// Maps' category circles, read off a screenshot of its shopping-centre
/// grid: about 56pt across, with the name beneath in up to two lines.
const CIRCLE_DIAMETER = 56
const LABEL_GAP = 6
const LABEL_LINES = 2
/// The rows' icon column, as wide as the widest symbol at its size, so every
/// title starts at one edge whatever the symbol's own width.
export const ROW_ICON_WIDTH = 28
/// How far a label may shrink before it breaks a word: at the accessibility
/// sizes a single word such as "Athletics" is wider than its column.
const LABEL_MIN_SCALE = 0.6
/// How far up from its bottom edge the list's card curves into its corners,
/// measured on an iOS 27 simulator. The list clips the grid's row to that
/// card even with its background cleared, so the grid stands this far clear
/// of the bottom or the corner cuts into the last row's first tile.
const CARD_CORNER_HEIGHT = 24

type Props = {
	groups: CategoryGroup[]
	onOpen: (group: CategoryGroup) => void
}

/// A grid while the text size leaves it four columns; a list after, where a
/// narrower grid would leave each label a word or two a line.
export function categoryLayoutFor(fontScale: number): 'grid' | 'list' {
	return columnsForFontScale(fontScale) < 4 ? 'list' : 'grid'
}

/// The map sheet's categories, drawn into the sheet's list: a grid of tiles,
/// or at large text sizes one row each. Only groups with places reach here,
/// so every one opens a list with something in it.
export function CategoryGrid({groups, onOpen}: Props): React.ReactNode {
	let {fontScale} = useWindowDimensions()

	if (categoryLayoutFor(fontScale) === 'list') {
		return groups.map((group) => (
			<DisclosureRow
				key={group.label}
				image={{systemName: group.icon, tint: groupColor(group.gradient), width: ROW_ICON_WIDTH}}
				onPress={() => onOpen(group)}
				title={group.label}
				titleLines={LABEL_LINES}
			/>
		))
	}

	return (
		// The grid is one row of the list, drawn without the row's card, so
		// other sections can sit below it in the same list.
		<VStack
			modifiers={[
				listRowBackground('clear'),
				listRowInsets({top: 0, leading: 0, bottom: CARD_CORNER_HEIGHT, trailing: 0}),
			]}
		>
			<TileGrid
				accessibilityId={CATEGORY_GRID_ID}
				items={groups}
				keyForItem={(group) => group.label}
				renderItem={(group) => <CategoryTile group={group} onPress={() => onOpen(group)} />}
			/>
		</VStack>
	)
}

function CategoryTile({
	group,
	onPress,
}: {
	group: CategoryGroup
	onPress: () => void
}): React.ReactNode {
	let [start, end] = group.gradient
	return (
		<Button modifiers={[buttonStyle('plain'), accessibilityLabel(group.label)]} onPress={onPress}>
			{/* contentShape on the label, not the Button: SwiftUI hit-tests a
			    button by what its label draws, and the gaps beside the circle
			    would otherwise miss. */}
			{/* fixedSize keeps the tile at its own full height; without it the
			    grid row offers one line's height and a two-line name truncates. */}
			<VStack
				modifiers={[
					contentShape(shapes.rectangle()),
					frame({maxWidth: FILL_WIDTH}),
					fixedSize({horizontal: false, vertical: true}),
				]}
				spacing={LABEL_GAP}
			>
				<ZStack>
					<Circle
						modifiers={[
							frame({width: CIRCLE_DIAMETER, height: CIRCLE_DIAMETER}),
							foregroundStyle({
								type: 'radialGradient',
								colors: [displayP3(start), displayP3(end)],
								center: {x: 0.5, y: 0},
								startRadius: 0,
								endRadius: CIRCLE_DIAMETER,
							}),
						]}
					/>
					<Image
						modifiers={[
							font({textStyle: 'title2'}),
							// The circle keeps its size at every text size, so the glyph
							// in it has to as well.
							dynamicTypeSize({max: 'large'}),
							foregroundStyle(c.white),
						]}
						systemName={group.icon}
					/>
				</ZStack>
				<Text
					modifiers={[
						font({textStyle: 'subheadline'}),
						multilineTextAlignment('center'),
						lineLimit(LABEL_LINES),
						minimumScaleFactor(LABEL_MIN_SCALE),
						frame({maxWidth: FILL_WIDTH}),
					]}
				>
					{group.label}
				</Text>
			</VStack>
		</Button>
	)
}
