import * as React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import {Icon} from '@frogpond/icon'
import type {Glyphs} from '@frogpond/icon'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8,
		paddingHorizontal: 8,
		paddingVertical: 0,
		marginVertical: 8,
		borderWidth: 1,
		borderRadius: 2,
		backgroundColor: c.systemGroupedBackground,
		borderColor: c.separator,
	},
	text: {
		color: c.label,
	},
	textWithIcon: {
		paddingRight: 8,
	},
})

type Props = {
	iconName?: Glyphs
	title: string
	isActive: boolean
}

export function ToolbarButton({title, iconName}: Props): React.ReactElement {
	return (
		<View style={[styles.button]}>
			<Text style={[styles.text, iconName ? styles.textWithIcon : null]}>
				{title}
			</Text>
			{iconName ? <Icon name={iconName} size={18} style={styles.text} /> : null}
		</View>
	)
}
