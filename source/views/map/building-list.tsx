import * as React from 'react'
import {FlatList, StyleSheet, Text, View} from 'react-native'
import {ListRow, Title, Detail, ListSeparator} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import type {Building, Feature} from './types'

type Props = {
	buildings: Array<Feature<Building>>
	onSelect: (id: string) => void
}

const Row = React.memo(function Row({
	building,
	onSelect,
}: {
	building: Feature<Building>
	onSelect: (id: string) => void
}) {
	let {name, nickname} = building.properties
	return (
		<ListRow arrowPosition="center" onPress={() => onSelect(building.id)}>
			<Title>{name}</Title>
			{nickname ? <Detail>{nickname}</Detail> : null}
		</ListRow>
	)
})

export function BuildingList({buildings, onSelect}: Props): React.ReactNode {
	let renderItem = React.useCallback(
		({item}: {item: Feature<Building>}) => (
			<Row building={item} onSelect={onSelect} />
		),
		[onSelect],
	)

	let keyExtractor = React.useCallback((item: Feature<Building>) => item.id, [])

	if (buildings.length === 0) {
		return (
			<View style={styles.empty}>
				<Text style={styles.emptyText}>No buildings to show.</Text>
			</View>
		)
	}

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			data={buildings}
			keyExtractor={keyExtractor}
			keyboardShouldPersistTaps="handled"
			renderItem={renderItem}
		/>
	)
}

const styles = StyleSheet.create({
	empty: {padding: 24, alignItems: 'center'},
	emptyText: {color: c.label, fontSize: 15},
})
