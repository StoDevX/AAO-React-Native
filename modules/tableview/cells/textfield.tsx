import * as React from 'react'
import {
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TextInputProps,
} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
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

type Props = {
	label?: string
	_ref?: {current: null | React.ElementRef<typeof TextInput>}
	disabled: boolean
	multiline?: boolean
	onChangeText: (value: string) => void
	onSubmitEditing?: (value: string) => void
	placeholder: string
	returnKeyType: 'done' | 'next' | 'default'
	secureTextEntry: boolean
	autoCapitalize: 'characters' | 'words' | 'sentences' | 'none'
	value: string
	labelWidth?: number
}

export class CellTextField extends React.Component<Props> {
	static defaultProps = {
		disabled: false,
		placeholder: '',
		returnKeyType: 'default',
		secureTextEntry: false,
		autoCapitalize: 'none',
	}

	_ref = this.props._ref || React.createRef()

	focusInput = (): void => {
		this._ref.current && this._ref.current.focus()
	}

	onSubmit = (): void => {
		this.props.onSubmitEditing?.(this.props.value)
	}

	render(): JSX.Element {
		let moreProps: TextInputProps = {}
		if (this.props.multiline) {
			moreProps.scrollEnabled = false
		}

		let labelWidthStyle =
			this.props.labelWidth != null ? {width: this.props.labelWidth} : null

		let label = this.props.label ? (
			<Text onPress={this.focusInput} style={[styles.label, labelWidthStyle]}>
				{this.props.label}
			</Text>
		) : (
			<Text style={styles.hiddenLabel} />
		)

		let input = (
			<TextInput
				ref={this.props._ref}
				autoCapitalize={this.props.autoCapitalize}
				autoCorrect={false}
				clearButtonMode="while-editing"
				editable={!this.props.disabled}
				multiline={this.props.multiline || false}
				onChangeText={this.props.onChangeText}
				onSubmitEditing={this.onSubmit}
				placeholder={this.props.placeholder}
				placeholderTextColor={c.iosPlaceholderText}
				returnKeyType={this.props.returnKeyType}
				secureTextEntry={this.props.secureTextEntry}
				style={styles.customTextInput}
				value={this.props.value}
				{...moreProps}
			/>
		)

		let style = this.props.multiline
			? styles.multilineCell
			: styles.singlelineCell

		return (
			<Cell
				cellAccessoryView={input}
				cellContentView={label}
				contentContainerStyle={style}
			/>
		)
	}
}
