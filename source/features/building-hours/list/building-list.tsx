import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {foregroundStyle, listStyle, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import type {BuildingType} from '../types'
import {BuildingListRow} from './building-list-row'

type SectionData = {
	title: string
	data: BuildingType[]
}

type Props = {
	sections: SectionData[]
	now: Moment
	onPressBuilding: (building: BuildingType) => void
	onRefresh?: () => unknown
	isLoading?: boolean
}

export function BuildingList({
	sections,
	now,
	onPressBuilding,
	onRefresh,
	isLoading,
}: Props): React.ReactNode {
	let isEmpty = sections.every((s) => s.data.length === 0)

	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					...(onRefresh
						? [
								refreshable(async () => {
									await onRefresh()
								}),
							]
						: []),
				]}
			>
				{isEmpty && !isLoading ? (
					<Text modifiers={[foregroundStyle(c.secondaryLabel), padding({vertical: 16})]}>
						No building hours available.
					</Text>
				) : (
					sections
						.filter((section) => section.data.length > 0)
						.map((section) => (
							<Section key={section.title} title={section.title}>
								{section.data.map((building) => (
									<BuildingListRow
										key={building.name}
										building={building}
										now={now}
										onPress={onPressBuilding}
									/>
								))}
							</Section>
						))
				)}
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
