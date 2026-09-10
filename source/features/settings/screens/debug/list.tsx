import * as React from 'react'
import {StyleSheet, Text as RNText} from 'react-native'
import {ContentUnavailableView, Host, List, Section, Text} from '@expo/ui/swift-ui'
import {listStyle, textSelection} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {DebugRow} from './row'
import {useAppSelector} from '../../../../redux'

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
				return <DebugObjectItem item={state as Record<string, unknown>} onDrillDown={onDrillDown} />
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
			return <RNText>unknown type: {typeof state}</RNText>
		}
	}
}

export const DebugSimpleItem = ({item}: {item: unknown}): React.ReactNode => {
	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				<Section title={typeof item}>
					{/* Selectable: the whole point of this screen is copying a
					    value out of it. */}
					<Text modifiers={[textSelection(true)]}>{String(item)}</Text>
				</Section>
			</List>
		</Host>
	)
}

export const DebugToStringItem = ({item}: {item: unknown}): React.ReactNode => {
	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				<Section title={typeof item}>
					{/* Selectable: the whole point of this screen is copying a
					    value out of it. */}
					<Text modifiers={[textSelection(true)]}>{String(item)}</Text>
				</Section>
			</List>
		</Host>
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
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				{keyed.length === 0 ? (
					<ContentUnavailableView systemImage="curlybraces" title="Nothing found." />
				) : (
					<Section>
						{keyed.map((debugItem) => (
							<DebugRow key={String(debugItem.key)} data={debugItem} onPress={onDrillDown} />
						))}
					</Section>
				)}
			</List>
		</Host>
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
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				{keyed.length === 0 ? (
					<ContentUnavailableView systemImage="curlybraces" title="Nothing found." />
				) : (
					<Section>
						{keyed.map((debugItem) => (
							<DebugRow key={String(debugItem.key)} data={debugItem} onPress={onDrillDown} />
						))}
					</Section>
				)}
			</List>
		</Host>
	)
}

let styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
