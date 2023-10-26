import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'

import Popover, {PopoverPlacement} from 'react-native-popover-view'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import * as c from '@frogpond/colors'
import {TableView} from '@frogpond/tableview'

import {FilterSection} from './section'
import type {FilterType} from './types'

type Props<T extends object> = {
	anchor: React.RefObject<View>
	filter: FilterType<T>
	onClosePopover: (filter: FilterType<T>) => unknown
	visible: boolean
}

export function FilterPopover<T extends object>(props: Props<T>): JSX.Element {
	let {anchor, onClosePopover, visible} = props
	let [filter, setFilter] = useState<FilterType<T>>(props.filter)
	let insets = useSafeAreaInsets()

	return (
		<Popover
			displayAreaInsets={insets}
			from={anchor}
			isVisible={visible}
			onRequestClose={() => onClosePopover(filter)}
			placement={PopoverPlacement.BOTTOM}
			popoverStyle={styles.container}
		>
			<TableView>
				<FilterSection<T>
					filter={filter}
					onChange={(filter) => setFilter(filter)}
				/>
			</TableView>
		</Popover>
	)
}

const styles = StyleSheet.create({
	container: {
		minWidth: 200,
		maxWidth: 300,
		backgroundColor: c.systemGroupedBackground,
	},
})
