import * as React from 'react'
import {useState} from 'react'
import {StyleProp, ViewStyle} from 'react-native'
// import {Popover} from '@expo/ui/swift-ui'
import type {FilterType} from './types'

type Props<T extends object> = {
	filter: FilterType<T>
	isActive: boolean
	onPopoverDismiss: (filter: FilterType<T>) => unknown
	style?: StyleProp<ViewStyle>
	title: string
}

export function FilterToolbarButton<T extends object>(
	props: Props<T>,
): React.ReactNode {
	let {onPopoverDismiss: _onPopoverDismiss, filter, style: _style, title: _title} = props

	let [_popoverVisible, _setPopoverVisible] = useState(false)
	let [_editedFilter, _setEditedFilter] = useState<FilterType<T>>(props.filter)

	if (filter.type === 'list') {
		if (!filter.spec.options.length) {
			return null
		}
	}

	return (
		<></>
		// waiting for expo/ui@beta.10 to work with expo
		// <Popover
		// 	isPresented={popoverVisible}
		// 	arrowEdge="leading"
		// 	attachmentAnchor="trailing"
		// 	onStateChange={(newState) => {
		// 		if (newState.isPresented === false) {
		// 			onPopoverDismiss(editedFilter)
		// 			setPopoverVisible(false)
		// 		}
		// 	}}
		// >
		// 	<Popover.Trigger>
		// 		<Touchable
		// 			highlight={false}
		// 			onPress={() => setPopoverVisible(true)}
		// 			style={[buttonStyles.button, style]}
		// 		>
		// 			<Text style={[buttonStyles.text, buttonStyles.textWithIcon]}>
		// 				{title}
		// 			</Text>
		// 			<Ionicons name="chevron-down" size={18} style={buttonStyles.text} />
		// 		</Touchable>
		// 	</Popover.Trigger>

		// 	<Popover.Content>
		// 		<TableView>
		// 			<FilterSection<T>
		// 				filter={editedFilter}
		// 				onChange={(updatedFilter) => setEditedFilter(updatedFilter)}
		// 			/>
		// 		</TableView>
		// 	</Popover.Content>
		// </Popover>
	)
}
