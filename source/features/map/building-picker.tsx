import * as React from 'react'
import {StyleSheet, TextInput, View} from 'react-native'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import fuzzyfind from 'fuzzyfind'

import {BuildingList} from './building-list'
import {
	CATEGORY_LABELS,
	CategoryPicker,
	LABEL_TO_CATEGORY,
	type CategoryLabel,
} from './category-picker'
import {mapDataOptions} from './query'
import type {Building, Feature} from './types'

type Props = {
	onSelect: (id: string) => void
}

export function BuildingPicker({onSelect}: Props): React.ReactNode {
	let [category, setCategory] = React.useState<CategoryLabel>('Buildings')
	let [query, setQuery] = React.useState('')

	let {data: buildings = []} = useQuery(mapDataOptions)

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
			<BuildingList buildings={visible} onSelect={onSelect} />
		</View>
	)
}

// Re-export so the map screens can reference the canonical category label list.
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
