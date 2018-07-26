// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import NativeSearchBar from 'react-native-search-bar'
import * as c from '../colors'
import type {ViewStyleProp} from '../../types'

const styles = StyleSheet.create({
	searchbar: {
		height: 44,
	},
})

type PropsType = {
	getRef?: any,
	backgroundColor?: string,
	style?: ViewStyleProp,
	placeholder?: string,
	onFocus?: () => any,
	onCancel?: () => any,
	onChangeText?: string => any,
	onSearchButtonPress: string => any,
	text?: string,
	textFieldBackgroundColor?: string,
}

export const SearchBar = (props: PropsType) => {
	return (
		<NativeSearchBar
			ref={props.getRef}
			barTintColor={props.backgroundColor || c.iosGray}
			hideBackground={true}
			onCancelButtonPress={props.onCancel || (() => {})}
			onChangeText={props.onChangeText || (() => {})}
			onFocus={props.onFocus || (() => {})}
			onSearchButtonPress={props.onSearchButtonPress || (() => {})}
			placeholder={props.placeholder || 'Search'}
			style={styles.searchbar}
			text={props.text || ''}
			textFieldBackgroundColor={props.textFieldBackgroundColor || c.white}
		/>
	)
}
