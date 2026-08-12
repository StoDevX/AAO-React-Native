import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Button,
	ContentUnavailableView,
	Host,
	ProgressView,
	TextField,
	VStack,
	useNativeState,
} from '@expo/ui/swift-ui'
import {
	autocorrectionDisabled,
	frame,
	padding,
	textFieldStyle,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
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
const CHROME_PADDING = 12
const FILL_WIDTH = Number.POSITIVE_INFINITY

type Props = {
	onSelect: (id: string) => void
}

export function BuildingPicker({onSelect}: Props): React.ReactNode {
	let [category, setCategory] = React.useState<CategoryLabel>('Buildings')
	let [typedQuery, setTypedQuery] = React.useState('')
	// The SwiftUI TextField owns its text; this is the handle for writing to it
	// from JS. Nothing here needs to, but the prop is how the field is bound.
	let queryState = useNativeState('')
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

	return (
		<Host style={styles.host}>
			<VStack spacing={CHROME_PADDING}>
				<VStack
					modifiers={[
						padding({horizontal: CHROME_PADDING, top: CHROME_PADDING}),
					]}
					spacing={CHROME_PADDING}
				>
					<TextField
						modifiers={[
							textFieldStyle('roundedBorder'),
							autocorrectionDisabled(true),
							frame({maxWidth: FILL_WIDTH}),
						]}
						onTextChange={setTypedQuery}
						placeholder="Search for a place"
						text={queryState}
					/>
					{query ? null : (
						<CategoryPicker onChange={setCategory} selected={category} />
					)}
				</VStack>

				<Results
					buildings={visible}
					error={error}
					isError={isError}
					isLoading={isLoading}
					onRetry={refetch}
					onSelect={onSelect}
					searching={Boolean(query)}
				/>
			</VStack>
		</Host>
	)
}

function Results({
	buildings,
	error,
	isError,
	isLoading,
	onRetry,
	onSelect,
	searching,
}: {
	buildings: Array<Feature<Building>>
	error: unknown
	isError: boolean
	isLoading: boolean
	onRetry: () => void
	onSelect: (id: string) => void
	searching: boolean
}) {
	if (isError) {
		return (
			<VStack spacing={CHROME_PADDING}>
				<ContentUnavailableView
					description={String(error)}
					systemImage="exclamationmark.triangle"
					title="Couldn't load buildings"
				/>
				<Button label="Try Again" onPress={onRetry} />
			</VStack>
		)
	}

	if (isLoading) {
		return <ProgressView />
	}

	if (buildings.length === 0) {
		return (
			<ContentUnavailableView
				description={
					searching
						? 'Try a different name or nickname.'
						: 'Nothing is filed under this category.'
				}
				systemImage={searching ? 'magnifyingglass' : 'mappin.slash'}
				title={searching ? 'No matches' : 'No buildings'}
			/>
		)
	}

	return <BuildingList buildings={buildings} onSelect={onSelect} />
}

const styles = StyleSheet.create({
	host: {flex: 1},
})
