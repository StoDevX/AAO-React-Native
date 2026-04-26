import * as React from 'react'
import {StyleSheet, TextInput, View} from 'react-native'
import {useNavigation} from '@react-navigation/native'
import * as c from '@frogpond/colors'
import fuzzyfind from 'fuzzyfind'

import {BuildingList} from './building-list'
import {
	CategoryPicker,
	CATEGORY_LABELS,
	LABEL_TO_CATEGORY,
	type CategoryLabel,
} from './category-picker'
import {useMapData} from './query'
import {useMapSelection} from './selection-context'
import type {Building, Feature} from './types'

export function BuildingPicker(): React.ReactNode {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	let navigation = useNavigation<any>()
	let {selectBuilding} = useMapSelection()
	let [category, setCategory] = React.useState<CategoryLabel>('Buildings')
	let [query, setQuery] = React.useState('')

	let {data: buildings = []} = useMapData()

	let visible = React.useMemo(() => {
		if (query.trim()) {
			let needle = query.toLowerCase()
			return fuzzyfind(needle, buildings, {
				accessor: (b: Feature<Building>) =>
					`${b.properties.name} ${b.properties.nickname}`.toLowerCase(),
			})
		}
		let key = LABEL_TO_CATEGORY[category]
		return buildings.filter((b) => b.properties.categories.includes(key))
	}, [buildings, category, query])

	let handleSelect = React.useCallback(
		(id: string) => {
			selectBuilding(id)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			navigation.replace('MapBuildingInfo', {buildingId: id})
		},
		[navigation, selectBuilding],
	)

	return (
		<View style={styles.container}>
			<TextInput
				accessibilityLabel="Search for a place"
				autoCorrect={false}
				clearButtonMode="while-editing"
				onChangeText={setQuery}
				placeholder="Search for a place"
				placeholderTextColor={c.secondaryLabel}
				style={styles.search}
				value={query}
			/>
			{query.trim() ? null : (
				<CategoryPicker onChange={setCategory} selected={category} />
			)}
			<BuildingList buildings={visible} onSelect={handleSelect} />
		</View>
	)
}

// Re-export so tests/maps screens can reference the canonical category label list.
export {CATEGORY_LABELS}

const styles = StyleSheet.create({
	container: {flex: 1, backgroundColor: c.systemGroupedBackground},
	search: {
		marginHorizontal: 12,
		marginTop: 12,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: c.tertiarySystemFill,
		color: c.label,
		fontSize: 15,
	},
})
