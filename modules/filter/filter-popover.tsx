import * as React from 'react'
import {RefObject, useState} from 'react'
import Popover, {PopoverPlacement} from 'react-native-popover-view'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
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
	let safeareaInsets = useSafeAreaInsets()

	return (
		<Popover
			from={anchor}
			isVisible={visible}
			onRequestClose={() => onClosePopover(filter)}
			placement={PopoverPlacement.BOTTOM}
			popoverStyle={popoverContainer}
			displayAreaInsets={safeareaInsets}
		>
			{/* This view wrapper shouldn't be needed but it does appear to fix a rendering issue */}
			<View style={popoverContainer}>
				<FilterSection
					filter={filter}
					onChange={(filter) => setFilter(filter)}
				/>
			</View>
		</Popover>
	)
}

const popoverContainer = {
	minWidth: 200,
	maxWidth: 300,
	backgroundColor: c.sectionBgColor,
}
