import * as React from 'react'
import {SectionList, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {ListFooter} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {useFilterStore} from './store'
import {SportSection} from './types'
import {isSectionFullySelected, toggleSectionSelection} from './utils'

interface AthleticsFiltersProps {
	sports: SportSection[]
}

export function AthleticsFilters({sports}: AthleticsFiltersProps): React.ReactNode {
	const selectedSports = useFilterStore((s) => s.selectedSports)
	const toggleSport = useFilterStore((s) => s.toggleSport)
	const setSelectedSports = useFilterStore((s) => s.setSelectedSports)

	const handleSelectAll = (sectionTitle: string) => {
		const sectionSports = sports.find((s) => s.title === sectionTitle)?.data ?? []
		setSelectedSports(toggleSectionSelection(sectionSports, selectedSports))
	}

	return (
		<SectionList
			ListFooterComponent={
				<ListFooter title="Filter preferences are saved locally to your device." />
			}
			contentContainerStyle={styles.listContainer}
			keyExtractor={(item) => item}
			renderItem={({item}) => (
				<TouchableOpacity
					accessibilityLabel={item}
					accessibilityRole="checkbox"
					accessibilityState={{checked: selectedSports.includes(item)}}
					onPress={() => toggleSport(item)}
					style={[
						styles.filterButton,
						selectedSports.includes(item) && styles.selectedFilterButton,
					]}
				>
					<Text
						style={[
							styles.filterButtonText,
							selectedSports.includes(item) && styles.selectedFilterButtonText,
						]}
					>
						{item.replace(/^(Men's|Women's)\s/u, '')}
					</Text>
				</TouchableOpacity>
			)}
			renderSectionHeader={({section: {title}}) => {
				const sectionSports = sports.find((s) => s.title === title)?.data
				const allSelected = sectionSports
					? isSectionFullySelected(sectionSports, selectedSports)
					: false
				return (
					<View>
						<Text style={styles.sectionHeader}>{title}</Text>
						<TouchableOpacity
							accessibilityLabel={`All ${title}`}
							accessibilityRole="checkbox"
							accessibilityState={{checked: allSelected}}
							onPress={() => handleSelectAll(title)}
							style={[styles.filterButton, allSelected && styles.selectedFilterButton]}
						>
							<Text
								style={[styles.filterButtonText, allSelected && styles.selectedFilterButtonText]}
							>
								All
							</Text>
						</TouchableOpacity>
					</View>
				)
			}}
			sections={sports}
			stickyHeaderHiddenOnScroll={true}
		/>
	)
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.systemGroupedBackground,
		paddingHorizontal: 20,
	},
	sectionHeader: {
		backgroundColor: c.systemGroupedBackground,
		color: c.label,
		fontWeight: 'bold',
		paddingTop: 15,
	},
	filterButton: {
		backgroundColor: c.systemBackground,
		borderColor: c.separator,
		borderRadius: 5,
		borderWidth: 1,
		justifyContent: 'center',
		marginVertical: 5,
		minHeight: 44,
		paddingHorizontal: 12,
	},
	filterButtonText: {
		color: c.label,
		fontSize: 14,
	},
	selectedFilterButton: {
		backgroundColor: c.blue,
		borderColor: c.blue,
	},
	selectedFilterButtonText: {
		color: c.white,
		fontWeight: 'bold',
	},
})
