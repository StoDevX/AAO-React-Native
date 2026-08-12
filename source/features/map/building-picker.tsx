import * as React from 'react'
import {StyleSheet, TextInput, View} from 'react-native'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'
import fuzzyfind from 'fuzzyfind'

import {BuildingList} from './building-list'
import {
	CategoryPicker,
	LABEL_TO_CATEGORY,
	type CategoryLabel,
} from './category-picker'
import {mapDataOptions} from './query'
import type {Building, Feature} from './types'

/// Matches the debounce every other search screen in the app uses.
const SEARCH_DEBOUNCE_MS = 200

type Props = {
	onSelect: (id: string) => void
}

export function BuildingPicker({onSelect}: Props): React.ReactNode {
	let [category, setCategory] = React.useState<CategoryLabel>('Buildings')
	let [typedQuery, setTypedQuery] = React.useState('')
	let query = useDebounce(typedQuery.trim(), SEARCH_DEBOUNCE_MS)

	let {
		data: buildings = [],
		error,
		isError,
		isLoading,
		refetch,
	} = useQuery(mapDataOptions)

	let visible = React.useMemo(() => {
		// fuzzyfind is subsequence-based and lowercases both sides itself, so
		// the needle only has to be trimmed -- a leading space would otherwise
		// have to appear in the name before any of the typed letters.
		if (query) {
			return fuzzyfind(query, buildings, {
				accessor: (b: Feature<Building>) =>
					`${b.properties.name} ${b.properties.nickname ?? ''}`,
			})
		}
		let key = LABEL_TO_CATEGORY[category]
		return buildings.filter((b) => b.properties.categories?.includes(key))
	}, [buildings, category, query])

	// Rendered in every branch so the field never disappears mid-typing.
	let searchField = (
		<TextInput
			accessibilityLabel="Search for a place"
			autoCorrect={false}
			clearButtonMode="while-editing"
			onChangeText={setTypedQuery}
			placeholder="Search for a place"
			placeholderTextColor={c.secondaryLabel}
			style={styles.search}
			value={typedQuery}
		/>
	)

	if (isError) {
		return (
			<View style={styles.container}>
				{searchField}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${error}`}
				/>
			</View>
		)
	}

	if (isLoading) {
		return (
			<View style={styles.container}>
				{searchField}
				<LoadingView />
			</View>
		)
	}

	return (
		<View style={styles.container}>
			{searchField}
			{query ? null : (
				<CategoryPicker onChange={setCategory} selected={category} />
			)}
			<BuildingList buildings={visible} onSelect={onSelect} />
		</View>
	)
}

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
