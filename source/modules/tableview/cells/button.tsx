import * as React from 'react'
import {StyleProp, StyleSheet, Text, TextStyle} from 'react-native'
import {Cell} from '../index'
import * as c from '../../colors'
import Ionicon from '@expo/vector-icons/Ionicons'

type IconName = keyof typeof Ionicon.glyphMap

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

interface ButtonCellProps {
	indeterminate?: boolean
	disabled?: boolean
	onPress: () => void
	textStyle?: StyleProp<TextStyle>
	title: string
	accessoryIcon?: IconName
}

export function ButtonCell({
	indeterminate = false,
	disabled = false,
	onPress,
	textStyle,
	title,
	accessoryIcon,
}: ButtonCellProps): React.JSX.Element {
	return (
		<Cell
			cellAccessoryView={
				accessoryIcon ? (
					<Ionicon
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
