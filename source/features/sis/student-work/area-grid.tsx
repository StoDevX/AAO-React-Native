import * as React from 'react'
import {useWindowDimensions} from 'react-native'
import {Grid, Spacer, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityIdentifier,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import {GradientTile} from '../../../components/gradient-tile'
import {
	columnsForFontScale,
	FILL_WIDTH,
	inRows,
	TILE_SPACING,
} from '../../../components/tile-layout'
import type {AreaStatus, StudentWorkArea} from './areas'

/// Mirrored by TestIdentifiers.StudentWork.areaGrid.
const AREA_GRID_ID = 'student-work-area-grid'

type Props = {
	areas: StudentWorkArea[]
	membership: Map<string, AreaStatus>
	onSelectArea: (area: StudentWorkArea) => void
}

/// The landing screen's area tiles, sitting in one row of its list as
/// Directory's contact grid does, so the presets below can be list rows.
export function AreaGrid({areas, membership, onSelectArea}: Props): React.ReactNode {
	let {fontScale} = useWindowDimensions()
	let columns = columnsForFontScale(fontScale)

	return (
		<VStack
			modifiers={[
				listRowBackground('clear'),
				listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
				listRowSeparator('hidden'),
				frame({maxWidth: FILL_WIDTH}),
			]}
		>
			<Grid
				alignment="top"
				horizontalSpacing={TILE_SPACING}
				// The Grid has no accessibility presence of its own; contain() gives
				// it one, with the tiles as its children, for a UI test to count.
				modifiers={[accessibilityElement('contain'), accessibilityIdentifier(AREA_GRID_ID)]}
				verticalSpacing={TILE_SPACING}
			>
				{inRows(areas, columns).map((row, i) => (
					// oxlint-disable-next-line react/no-array-index-key -- a row is its position; tiles are keyed by slug
					<Grid.Row key={i}>
						{row.map((area) => {
							let status = membership.get(area.slug)
							return (
								<GradientTile
									key={area.slug}
									count={status?.count}
									disabled={status?.disabled ?? false}
									gradient={area.gradient}
									icon={area.icon}
									onPress={() => onSelectArea(area)}
									ratio={1}
									title={area.name}
								/>
							)
						})}
						{/* A short last row leaves its columns empty rather than
						    stretching the tiles in it. */}
						{Array.from({length: columns - row.length}, (_, j) => (
							<Spacer key={j} />
						))}
					</Grid.Row>
				))}
			</Grid>
		</VStack>
	)
}
