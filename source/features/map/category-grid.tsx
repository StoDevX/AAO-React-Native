import * as React from 'react'
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
	minimumScaleFactor,
	multilineTextAlignment,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {displayP3} from '@frogpond/colors'

import {TileGrid} from '../../components/tile-grid'
import {FILL_WIDTH} from '../../components/tile-layout'
import type {CategoryGroup} from './lib/category-groups'

/// Names the grid for a UI test counting its tiles.
export const CATEGORY_GRID_ID = 'map-category-grid'

/// Maps' category circles, read off a screenshot of its shopping-centre
/// grid: about 56pt across, with the name beneath in up to two lines.
const CIRCLE_DIAMETER = 56
const LABEL_GAP = 6
const LABEL_LINES = 2
/// How far a label may shrink before it breaks a word: at the accessibility
/// sizes a single word such as "Athletics" is wider than its column.
const LABEL_MIN_SCALE = 0.6

type Props = {
	groups: CategoryGroup[]
	onOpen: (group: CategoryGroup) => void
}

/// The map sheet's category tiles. Only groups with places reach here, so
/// every tile opens a list with something in it.
export function CategoryGrid({groups, onOpen}: Props): React.ReactNode {
	return (
		<TileGrid
			accessibilityId={CATEGORY_GRID_ID}
			items={groups}
			keyForItem={(group) => group.label}
			renderItem={(group) => <CategoryTile group={group} onPress={() => onOpen(group)} />}
		/>
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
