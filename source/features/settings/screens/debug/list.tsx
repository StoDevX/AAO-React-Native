import * as React from 'react'
import {FlatList, ScrollView, StyleSheet, Text} from 'react-native'
import {DebugRow} from './row'
import {NoticeView} from '@frogpond/notice'
import {ListSeparator} from '@frogpond/lists'
import {useAppSelector} from '../../../../redux'
import {Section, TableView} from 'react-native-tableview-simple'

export const NavigationKey = 'DebugView' as const

type Props = {
	state?: unknown
	onDrillDown?: (key: string | number) => void
}

export const DebugRootView = (): React.ReactNode => {
	let reduxState = useAppSelector((state) => {
		return state
	})

	return <DebugView state={reduxState} />
}

export const DebugView = (props: Props = {}): React.ReactNode => {
	let {state, onDrillDown} = props

	if (state === null) {
		return <DebugSimpleItem item={state} />
	}

	switch (typeof state) {
		case 'object': {
			if (Array.isArray(state)) {
				return <DebugArrayItem item={state} onDrillDown={onDrillDown} />
			} else {
				return (
					<DebugObjectItem
						item={state as Record<string, unknown>}
						onDrillDown={onDrillDown}
					/>
				)
			}
		}
		case 'function':
		case 'symbol':
			return <DebugToStringItem item={state} />
		case 'bigint':
		case 'number':
		case 'boolean':
		case 'string':
		case 'undefined':
			return <DebugSimpleItem item={state} />
		default: {
			return <Text>unknown type: {typeof state}</Text>
		}
	}
}

export const DebugSimpleItem = ({item}: {item: unknown}): React.ReactNode => {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<TableView style={styles.table}>
				<Section
					header={typeof item}
					hideSurroundingSeparators={true}
					roundedCorners={true}
				>
					<Text>{String(item)}</Text>
				</Section>
			</TableView>
		</ScrollView>
	)
}

export const DebugToStringItem = ({item}: {item: unknown}): React.ReactNode => {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<TableView style={styles.table}>
				<Section
					header={typeof item}
					hideSurroundingSeparators={true}
					roundedCorners={true}
				>
					<Text>{String(item)}</Text>
				</Section>
			</TableView>
		</ScrollView>
	)
}

export const DebugArrayItem = ({
	item,
	onDrillDown,
}: {
	item: unknown[]
	onDrillDown?: (key: string | number) => void
}): React.ReactNode => {
	let keyed = item.map((value, key) => ({key, value}))

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="Nothing found." />}
			contentInsetAdjustmentBehavior="automatic"
			data={keyed}
			renderItem={({item: debugItem}) => (
				<DebugRow data={debugItem} onPress={onDrillDown} />
			)}
		/>
	)
}

export const DebugObjectItem = ({
	item,
	onDrillDown,
}: {
	item: Record<string, unknown>
	onDrillDown?: (key: string | number) => void
}): React.ReactNode => {
	let keyed = Object.entries(item).map(([key, value]) => ({key, value}))

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="Nothing found." />}
			contentInsetAdjustmentBehavior="automatic"
			data={keyed}
			renderItem={({item: debugItem}) => (
				<DebugRow data={debugItem} onPress={onDrillDown} />
			)}
		/>
	)
}

let styles = StyleSheet.create({
	table: {marginHorizontal: 15},
})
