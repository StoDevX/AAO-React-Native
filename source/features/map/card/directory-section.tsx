import * as React from 'react'
import {Group, Section} from '@expo/ui/swift-ui'

import {DisclosureRow} from '../../../components/rows'
import {DETAIL_ROW, LAST_ROW} from '../../../components/place-card/card-style'
import {SectionHeading} from '../../../components/place-card/section-heading'
import {floorRows} from '../directory/directory'
import type {BuildingDirectory} from '../directory/types'
import type {StackEntry} from '../lib/also-here'

/// Names a floor's row for UI tests.
export const directoryFloorId = (index: number): string => `directory-floor-${index}`

/// What is on each floor of a building, as Maps lists a mall's directory: a
/// row per floor with anything on it, bottom to top, each stacking that
/// floor's sheet over the card.
export function DirectorySection({
	directory,
	onOpen,
}: {
	directory: BuildingDirectory | undefined
	onOpen: (entry: StackEntry) => void
}): React.ReactNode {
	let rows = directory ? floorRows(directory) : []
	if (!directory || rows.length === 0) {
		return null
	}
	return (
		<Section>
			<SectionHeading title="Directory" />
			{rows.map((row, position) => (
				// The card's rows sit on the sheet with its insets; a row takes no
				// modifiers of its own, so the group carries them to it.
				<Group key={row.index} modifiers={position === rows.length - 1 ? LAST_ROW : DETAIL_ROW}>
					<DisclosureRow
						detail={row.detail}
						identifier={directoryFloorId(row.index)}
						onPress={() => onOpen({kind: 'floor', building: directory.building, floor: row.index})}
						title={row.name}
					/>
				</Group>
			))}
		</Section>
	)
}
