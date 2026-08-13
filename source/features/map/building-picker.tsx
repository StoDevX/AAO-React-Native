import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Button,
	Host,
	HStack,
	Image,
	List,
	Section,
	Spacer,
	Text,
	TextField,
	VStack,
} from '@expo/ui/swift-ui'
import {
	autocorrectionDisabled,
	buttonStyle,
	font,
	foregroundStyle,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import fuzzyfind from 'fuzzyfind'

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

/// SwiftUI rather than React Native views, and the whole sheet is one `Host`.
///
/// The sheet is presented by react-native-screens as a `formSheet`, which does
/// not report its full-detent bounds to Yoga: laid out as React Native views,
/// the search field, the category tabs and the list all resolved to the top of
/// the sheet and drew over each other, while `onLayout` insisted they were
/// stacked correctly. One SwiftUI view filling the sheet has nothing to stack
/// wrongly -- SwiftUI lays its own contents out against the bounds it is given.
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

	return (
		<Host style={styles.host}>
			<List>
				<Section>
					<TextField
						modifiers={[autocorrectionDisabled(true)]}
						onTextChange={setTypedQuery}
						placeholder="Search for a place"
					/>
				</Section>

				{query ? null : (
					<Section>
						<CategoryPicker onChange={setCategory} selected={category} />
					</Section>
				)}

				<Section>
					{isError ? (
						<Button onPress={() => void refetch()}>
							<VStack alignment="leading" spacing={2}>
								<Text>{`A problem occured while loading: ${error}`}</Text>
								<Text>Tap to try again.</Text>
							</VStack>
						</Button>
					) : isLoading ? (
						<Text>Loading…</Text>
					) : visible.length === 0 ? (
						<Text>No buildings to show.</Text>
					) : (
						<List.ForEach>
							{visible.map((building) => (
								<BuildingRow
									key={building.id}
									building={building}
									onSelect={onSelect}
								/>
							))}
						</List.ForEach>
					)}
				</Section>
			</List>
		</Host>
	)
}

function BuildingRow({
	building,
	onSelect,
}: {
	building: Feature<Building>
	onSelect: (id: string) => void
}): React.ReactNode {
	let {name, nickname} = building.properties
	return (
		<Button
			// Without `plain`, SwiftUI tints a Button's whole label with the accent
			// colour and every building name reads as a link.
			modifiers={[buttonStyle('plain')]}
			onPress={() => onSelect(building.id)}
		>
			<HStack spacing={8}>
				<VStack alignment="leading" spacing={2}>
					<Text
						modifiers={[
							foregroundStyle({type: 'hierarchical', style: 'primary'}),
						]}
					>
						{name}
					</Text>
					{nickname ? (
						<Text
							modifiers={[
								font({textStyle: 'footnote'}),
								foregroundStyle({type: 'hierarchical', style: 'secondary'}),
							]}
						>
							{nickname}
						</Text>
					) : null}
				</VStack>
				<Spacer />
				{/* A Button is not a NavigationLink, so the disclosure chevron the
				    rest of the app's rows get from the platform has to be drawn. */}
				<Image
					modifiers={[
						foregroundStyle({type: 'hierarchical', style: 'tertiary'}),
					]}
					size={13}
					systemName="chevron.right"
				/>
			</HStack>
		</Button>
	)
}

const styles = StyleSheet.create({
	host: {flex: 1, backgroundColor: c.systemGroupedBackground},
})
