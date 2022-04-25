import {StyleProp, ViewStyle} from 'react-native'

export type Props = {
	getRef?: any
	active?: boolean
	backButtonAndroid?: 'search' | boolean
	backgroundColor?: string
	onCancel: () => unknown
	onChange: (data: string) => unknown
	onFocus: () => unknown
	onSubmit: () => unknown
	placeholder?: string
	style?: StyleProp<ViewStyle>
	textFieldBackgroundColor?: string
	value: string
}

export type AnimatedValueType = {
	start: number
	end: number
	duration: number
}
