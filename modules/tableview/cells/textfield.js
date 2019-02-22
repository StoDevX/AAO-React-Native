// @flow
import * as React from 'react'
import {StyleSheet, Text, Platform, TextInput} from 'react-native'
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

type Props = {|
	label?: string,
	_ref: any => any,
	disabled: boolean,
	multiline?: boolean,
	onChangeText: string => any,
	onSubmitEditing: string => any,
	placeholder: string,
	returnKeyType: 'done' | 'next' | 'default',
	secureTextEntry: boolean,
	autoCapitalize: 'characters' | 'words' | 'sentences' | 'none',
	value: string,
	labelWidth?: number,
|}

export class CellTextField extends React.Component<Props> {
	_input: any

	static defaultProps = {
		disabled: false,
		placeholder: '',
		_ref: () => {},
		returnKeyType: 'default',
		secureTextEntry: false,
		autoCapitalize: 'none',
	}

	focusInput = () => this._input.focus()

	cacheRef = (ref: any) => {
		this._input = ref
		this.props._ref(ref)
	}

	onSubmit = () => {
		this.props.onSubmitEditing(this.props.value)
	}

	render() {
		let moreProps = {}
		if (this.props.multiline) {
			moreProps.scrollEnabled = false
		}

		const labelWidthStyle =
			this.props.labelWidth !== null && this.props.labelWidth !== undefined
				? {width: this.props.labelWidth}
				: null

		const label = this.props.label ? (
			<Text onPress={this.focusInput} style={[styles.label, labelWidthStyle]}>
				{this.props.label}
			</Text>
		) : (
			<Text style={styles.hiddenLabel} />
		)

		const input = (
			<TextInput
				ref={this.cacheRef}
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
				style={[styles.customTextInput]}
				value={this.props.value}
				{...moreProps}
			/>
		)

		return (
			<Cell
				cellAccessoryView={input}
				cellContentView={label}
				contentContainerStyle={
					this.props.multiline ? styles.multilineCell : styles.singlelineCell
				}
			/>
		)
	}
}
