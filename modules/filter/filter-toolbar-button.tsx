import * as React from 'react'
import {useState} from 'react'
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
// import {Popover} from '@expo/ui/swift-ui'
import {Ionicons} from '@react-native-vector-icons/ionicons'
import type {FilterType} from './types'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {TableView} from '@frogpond/tableview'
import {FilterSection} from './section'

const buttonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 10,
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderWidth: 1,
		borderRadius: 2,
		backgroundColor: c.systemGroupedBackground,
		borderColor: c.separator,
	},
	text: {
		color: c.label,
		fontSize: 16,
	},
	textWithIcon: {
		paddingRight: 8,
	},
})

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
	let {onPopoverDismiss, filter, style, title} = props

	let [popoverVisible, setPopoverVisible] = useState(false)
	let [editedFilter, setEditedFilter] = useState<FilterType<T>>(props.filter)

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
