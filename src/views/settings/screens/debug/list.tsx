import * as React from 'react'
import {FlatList, ScrollView, StyleSheet, Text} from 'react-native'
import {DebugRow} from './row'
import {NoticeView} from '@frogpond/notice'
import {ListSeparator} from '@frogpond/lists'
import {useAppSelector} from '../../../../redux'
import {useLocalSearchParams, useRouter} from 'expo-router'
import {Section, TableView} from 'react-native-tableview-simple'

export const NavigationKey = 'DebugView' as const

type Props = {
	state?: unknown
}

export const DebugRootView = (): React.JSX.Element => {
	let reduxState = useAppSelector((state) => {
		return state
	})

	return <DebugView state={reduxState} />
}

export const DebugView = (props: Props = {}): React.JSX.Element => {
	let {state} = props

	if (state === null) {
		return <DebugSimpleItem item={state} />
	}

	switch (typeof state) {
		case 'object': {
			if (Array.isArray(state)) {
				return <DebugArrayItem item={state} />
			} else {
				return <DebugObjectItem item={state as Record<string, unknown>} />
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

export const DebugSimpleItem = ({item}: {item: unknown}): React.JSX.Element => {
	return (
		<ScrollView>
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

export const DebugToStringItem = ({
	item,
}: {
	item: unknown
}): React.JSX.Element => {
	return (
		<ScrollView>
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

let useKeyPath = () => {
	let params = useLocalSearchParams<{keyPath?: string}>()
	return params.keyPath ? (JSON.parse(params.keyPath) as string[]) : []
}

export const DebugArrayItem = ({
	item,
}: {
	item: unknown[]
}): React.JSX.Element => {
	let router = useRouter()
	let keyPath = useKeyPath()

	let keyed = item.map((value, key) => ({key, value}))

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="Nothing found." />}
			data={keyed}
			renderItem={({item: debugItem}) => (
				<DebugRow
					data={debugItem}
					onPress={() => {
						router.push({
							pathname: '/settings/debug',
							params: {
								keyPath: JSON.stringify([...keyPath, String(debugItem.key)]),
							},
						})
					}}
				/>
			)}
		/>
	)
}

export const DebugObjectItem = ({
	item,
}: {
	item: Record<string, unknown>
}): React.JSX.Element => {
	let router = useRouter()
	let keyPath = useKeyPath()

	let keyed = Object.entries(item).map(([key, value]) => ({key, value}))

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="Nothing found." />}
			data={keyed}
			renderItem={({item: debugItem}) => (
				<DebugRow
					data={debugItem}
					onPress={() =>
						router.push({
							pathname: '/settings/debug',
							params: {
								keyPath: JSON.stringify([...keyPath, debugItem.key]),
							},
						})
					}
				/>
			)}
		/>
	)
}

let styles = StyleSheet.create({
	table: {marginHorizontal: 15},
})
