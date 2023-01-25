import * as React from 'react'
import {
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TextInputProps,
} from 'react-native'
import {Cell} from '@frogpond/tableview'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	label: {
		width: 90,
		fontSize: 16,
		marginTop: Platform.OS === 'ios' ? -2 : 0, // lines the label up with the text on iOS
		alignSelf: 'center',
	},
	hiddenLabel: {
		width: 0,
	},
	customTextInput: {
		flex: 1,
	},
	singlelineCell: {
		height: Platform.OS === 'android' ? 65 : 44,
		alignItems: 'stretch',
		paddingTop: 0,
		paddingBottom: 0,
		flex: 1,
	},
	multilineCell: {
		alignItems: 'stretch',
		paddingTop: 10,
		paddingBottom: 10,
		flex: 1,
	},
})

type Props = TextInputProps & {
	label?: string
	labelWidth?: number
}

export const CellTextField = React.forwardRef<TextInput, Props>(
	(props, ref): JSX.Element => {
		let {
			placeholder = '',
			returnKeyType = 'default',
			secureTextEntry = false,
			autoCapitalize = 'none',
			multiline = false,
			labelWidth,
			onSubmitEditing,
			onChangeText,
			value,
			label,
		} = props

		let labelWidthStyle = labelWidth != null ? {width: labelWidth} : null

		let labelEl = label ? (
			<Text
				onPress={() => ref?.current?.focus()}
				style={[styles.label, labelWidthStyle]}
			>
				{label}
			</Text>
		) : (
			<Text style={styles.hiddenLabel} />
		)

		let input = (
			<TextInput
				ref={ref}
				autoCapitalize={autoCapitalize}
				autoCorrect={false}
				clearButtonMode="while-editing"
				multiline={multiline || false}
				onChangeText={onChangeText}
				onSubmitEditing={onSubmitEditing}
				placeholder={placeholder}
				placeholderTextColor={c.placeholderText}
				returnKeyType={returnKeyType}
				scrollEnabled={!multiline}
				secureTextEntry={secureTextEntry}
				style={styles.customTextInput}
				value={value}
				{...props}
			/>
		)

		let style = multiline ? styles.multilineCell : styles.singlelineCell

		return (
			<Cell
				cellAccessoryView={input}
				cellContentView={labelEl}
				contentContainerStyle={style}
			/>
		)
	},
)
