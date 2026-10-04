import * as React from 'react'
import {useWindowDimensions} from 'react-native'
import {Section, VStack} from '@expo/ui/swift-ui'
import {
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import {GradientTile} from '../../../components/gradient-tile'
import {DisclosureRow} from '../../../components/rows'
import {TileGrid} from '../../../components/tile-grid'
import {FILL_WIDTH, SCREEN_MARGIN, wideGridShape} from '../../../components/tile-layout'
import type {Layout} from '../../../lib/layout-store'
import type {AreaStatus, StudentWorkArea} from './areas'

function postingsLabel(count: number): string {
	if (count === 0) return 'no postings'
	return count === 1 ? '1 posting' : `${count} postings`
}

/// Mirrored by TestIdentifiers.StudentWork.areaGrid.
const AREA_GRID_ID = 'student-work-area-grid'

/// Prefixes each area row's identifier, before the area's slug; mirrored by
/// TestIdentifiers.StudentWork.areaRowPrefix.
const AREA_ROW_ID_PREFIX = 'student-work-area:'

/// Enough that no area name is cut off at any text size; the names are a short
/// curated set, so a long one cannot crowd the list.
const AREA_NAME_LINES = 5

type Props = {
	areas: StudentWorkArea[]
	/** Which the student picked from the screen's layout menu. */
	layout: Layout
	membership: Map<string, AreaStatus>
	onSelectArea: (area: StudentWorkArea) => void
}

/// The landing screen's areas, above its presets, as tiles or as rows.
export function AreaSection({layout, ...props}: Props): React.ReactNode {
	return layout === 'grid' ? <AreaGrid {...props} /> : <AreaRows {...props} />
}

type LayoutProps = Omit<Props, 'layout'>

/// The area tiles, sitting in one row of the landing's list as Directory's
/// contact grid does, so the presets below can be list rows.
function AreaGrid({areas, membership, onSelectArea}: LayoutProps): React.ReactNode {
	let {width, fontScale} = useWindowDimensions()
	let {columns, ratio} = wideGridShape(width - 2 * SCREEN_MARGIN, fontScale)

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
				columns={columns}
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
							ratio={ratio}
							reservesLabelLines={true}
							title={area.name}
						/>
					)
				}}
			/>
		</VStack>
	)
}

/// The areas as rows in a section of their own. An area with no postings
/// shows no count.
function AreaRows({areas, membership, onSelectArea}: LayoutProps): React.ReactNode {
	return (
		<Section>
			{areas.map((area) => (
				<DisclosureRow
					key={area.slug}
					badge={membership.get(area.slug)?.count}
					identifier={`${AREA_ROW_ID_PREFIX}${area.slug}`}
					image={{systemName: area.icon, gradient: area.gradient}}
					onPress={() => onSelectArea(area)}
					title={area.name}
					titleLines={AREA_NAME_LINES}
				/>
			))}
		</Section>
	)
}
