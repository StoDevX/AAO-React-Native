import * as React from 'react'
import {BaseText, Paragraph} from './formatting'
import {ViewProps, StyleProp, View, StyleSheet, ViewStyle} from 'react-native'

const styles = StyleSheet.create({
	list: {},
	listText: {
		flex: 1,
	},
	listItem: {
		alignItems: 'center',
		flexDirection: 'row',
	},
})

// the list itself
export const List = (props: ViewProps): JSX.Element => (
	<View {...props} style={[styles.list, props.style]} />
)

// the list item's text
export const ListText = (
	props: Parameters<typeof Paragraph>[0],
): JSX.Element => (
	<Paragraph {...props} style={[styles.listText, props.style]} />
)

// the list item's container box thing
export const ListItem = ({
	style,
	...props
}: Parameters<typeof ListText>[0] & {
	style: StyleProp<ViewStyle>
}): JSX.Element => (
	<View style={[styles.listItem, style]}>
		<BaseText>• </BaseText>
		<ListText {...props} />
	</View>
)
