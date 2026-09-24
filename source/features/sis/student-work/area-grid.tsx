import * as React from 'react'
import {VStack} from '@expo/ui/swift-ui'
import {
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import {GradientTile} from '../../../components/gradient-tile'
import {TileGrid} from '../../../components/tile-grid'
import {FILL_WIDTH} from '../../../components/tile-layout'
import type {AreaStatus, StudentWorkArea} from './areas'

function postingsLabel(count: number): string {
	if (count === 0) return 'no postings'
	return count === 1 ? '1 posting' : `${count} postings`
}

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
	return (
		<VStack
			modifiers={[
				listRowBackground('clear'),
				listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
				listRowSeparator('hidden'),
				frame({maxWidth: FILL_WIDTH}),
			]}
		>
			<TileGrid
				accessibilityId={AREA_GRID_ID}
				items={areas}
				keyForItem={(area) => area.slug}
				renderItem={(area) => {
					let status = membership.get(area.slug)
					return (
						<GradientTile
							count={status?.count}
							countLabel={postingsLabel}
							dimmed={status?.empty ?? false}
							gradient={area.gradient}
							icon={area.icon}
							onPress={() => onSelectArea(area)}
							ratio={1}
							title={area.name}
						/>
					)
				}}
			/>
		</VStack>
	)
}
