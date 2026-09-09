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
	favorites: string[]
	onToggleFavorite: (building: BuildingType) => void
	onSelect: (building: BuildingType) => void
	onRefresh?: () => unknown
	isLoading?: boolean
	/** The active search query, or `''` when no search is in progress. Distinguishes
	 * a search with no matches from the genuine no-data case, which need different
	 * wording. */
	searchQuery: string
}

export const BuildingList = React.memo(function BuildingList({
	sections,
	now,
	favorites,
	onToggleFavorite,
	onSelect,
	onRefresh,
	isLoading,
	searchQuery,
}: Props): React.ReactNode {
	let isEmpty = sections.every((s) => s.data.length === 0)
	// Trimmed to match `filterBuildings`, which treats a blank query as no
	// query at all. Without it, spaces typed over an empty list would claim
	// they were what filtered it.
	let activeQuery = searchQuery.trim()

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
						{activeQuery
							? `No results found for "${activeQuery}".`
							: 'No building hours available.'}
					</Text>
				) : (
					sections
						.filter((section) => section.data.length > 0)
						.map((section) => (
							<Section key={section.title} title={section.title}>
								{section.data.map((building) => (
									<BuildingListRow
										key={`${section.title}-${building.name}`}
										building={building}
										isFavorite={favorites.includes(building.name)}
										now={now}
										onSelect={onSelect}
										onToggleFavorite={onToggleFavorite}
									/>
								))}
							</Section>
						))
				)}
			</List>
		</Host>
	)
})

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
