import * as React from 'react'
import {SectionList, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import * as c from '@frogpond/colors'
import {useFilterStore} from './store'

interface AthleticsFiltersProps {
	sports: {title: string; data: string[]}[]
}

export function AthleticsFilters({sports}: AthleticsFiltersProps): React.ReactNode {
	const {selectedSports, toggleSport, setSelectedSports} = useFilterStore()

	const handleSelectAll = (sectionTitle: string) => {
		const sectionSports = sports.find((s) => s.title === sectionTitle)?.data ?? []
		const allSelected = sectionSports.every((sport) => selectedSports.includes(sport))
		if (allSelected) {
			setSelectedSports(selectedSports.filter((sport) => !sectionSports.includes(sport)))
		} else {
			setSelectedSports([...new Set([...selectedSports, ...sectionSports])])
		}
	}

	return (
		<SectionList
			contentContainerStyle={styles.listContainer}
			keyExtractor={(item) => item}
			ListFooterComponent={
				<Text style={styles.listFooterLabel}>
					Filter preferences are saved locally to your device.
				</Text>
			}
			ListFooterComponentStyle={styles.listFooter}
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
						{item.replace(/^(Men's|Women's)\s/, '')}
					</Text>
				</TouchableOpacity>
			)}
			renderSectionHeader={({section: {title}}) => {
				const allSelected =
					sports.find((s) => s.title === title)?.data.every((sport) => selectedSports.includes(sport)) ??
					false
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
								style={[
									styles.filterButtonText,
									allSelected && styles.selectedFilterButtonText,
								]}
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
		color: c.navyToNavy[0],
		fontWeight: 'bold',
		paddingTop: 15,
	},
	listFooter: {
		paddingTop: 15,
	},
	listFooterLabel: {
		color: c.secondaryLabel,
		fontSize: 12,
	},
	filterButton: {
		backgroundColor: c.systemBackground,
		borderColor: c.separator,
		borderRadius: 5,
		borderWidth: 1,
		marginVertical: 5,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	filterButtonText: {
		color: c.label,
		fontSize: 14,
	},
	selectedFilterButton: {
		backgroundColor: c.navyToNavy[0],
		borderColor: c.navyToNavy[0],
	},
	selectedFilterButtonText: {
		color: c.white,
		fontWeight: 'bold',
	},
})
