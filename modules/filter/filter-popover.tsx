import * as React from 'react'
import {RefObject, useState} from 'react'
import Popover, {PopoverPlacement} from 'react-native-popover-view'
import {FilterSection} from './section'
import type {FilterType} from './types'
import * as c from '@frogpond/colors'
import {View} from 'react-native'

type Props = {
	anchor: RefObject<View>
	filter: FilterType
	onClosePopover: (filter: FilterType) => unknown
	visible: boolean
}

export function FilterPopover(props: Props): JSX.Element {
	let {anchor, onClosePopover, visible} = props
	let [filter, setFilter] = useState<FilterType>(props.filter)

	return (
		<Popover
			from={anchor}
			isVisible={visible}
			onRequestClose={() => onClosePopover(filter)}
			placement={PopoverPlacement.BOTTOM}
			popoverStyle={popoverContainer}
		>
			<FilterSection filter={filter} onChange={(filter) => setFilter(filter)} />
		</Popover>
	)
}

const popoverContainer = {
	minWidth: 200,
	maxWidth: 300,
	backgroundColor: c.sectionBgColor,
}
