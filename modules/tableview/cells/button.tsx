import * as React from 'react'
import {StyleProp, StyleSheet, Text, TextStyle} from 'react-native'
import {Cell} from '@frogpond/tableview'
import * as c from '@frogpond/colors'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import type IoniconsGlyphs from '@react-native-vector-icons/ionicons/glyphmaps/Ionicons.json'

type IoniconsGlyph = keyof typeof IoniconsGlyphs

const styles = StyleSheet.create({
	title: {
		textAlign: 'left',
	},
	active: {
		color: c.link,
	},
	disabled: {
		color: c.secondaryLabel,
	},
})

type ButtonCellProps = {
	indeterminate?: boolean
	disabled?: boolean
	onPress: () => void
	textStyle?: StyleProp<TextStyle>
	title: string
	accessoryIcon?: IoniconsGlyph
}

export function ButtonCell({
	indeterminate,
	disabled,
	onPress,
	textStyle,
	title,
	accessoryIcon,
}: ButtonCellProps): React.ReactNode {
	return (
		<Cell
			cellAccessoryView={
				accessoryIcon ? (
					<Icon
						color={disabled ? styles.disabled.color : styles.active.color}
						name={accessoryIcon}
						size={26}
					/>
				) : null
			}
			cellStyle="RightDetail"
			isDisabled={indeterminate || disabled}
			onPress={onPress}
			title={
				<Text
					style={[
						indeterminate || disabled ? styles.disabled : styles.active,
						textStyle,
					]}
				>
					{title}
				</Text>
			}
			titleTextStyle={styles.title}
		/>
	)
}
