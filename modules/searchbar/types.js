// @flow

export type Props = {|
	getRef?: any,
	active?: boolean,
	backButtonAndroid?: 'search' | boolean,
	backgroundColor?: string,
	onCancel: () => any,
	onChange: string => any,
	onFocus: () => any,
	onSubmit: () => any,
	placeholder?: string,
	style?: any,
	textFieldBackgroundColor?: ?string,
	value: string,
|}
