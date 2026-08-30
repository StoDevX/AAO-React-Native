import * as React from 'react'
import {StyleProp, StyleSheet, Text, TextStyle} from 'react-native'
import {Cell} from '@frogpond/tableview'
import * as c from '@frogpond/colors'
import {SymbolView} from 'expo-symbols'
import type {SFSymbol} from 'sf-symbols-typescript'

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
	accessoryIcon?: SFSymbol
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
					<SymbolView
						name={accessoryIcon}
						size={26}
						tintColor={disabled ? styles.disabled.color : styles.active.color}
					/>
				) : null
			}
			cellStyle="RightDetail"
			isDisabled={indeterminate || disabled}
			onPress={onPress}
			title={
				<Text style={[indeterminate || disabled ? styles.disabled : styles.active, textStyle]}>
					{title}
				</Text>
			}
			titleTextStyle={styles.title}
		/>
	)
}
