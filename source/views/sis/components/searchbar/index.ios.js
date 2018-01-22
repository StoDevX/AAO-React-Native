// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import NativeSearchBar from 'react-native-search-bar'
import * as c from '../../../components/colors'

const styles = StyleSheet.create({
	searchbar: {
		backgroundColor: c.white,
		height: 44,
	},
})

type PropsType = {
	getRef?: any,
	style?: any,
	placeholder?: string,
	onChangeText: string => any,
	onSearchButtonPress: string => any,
	onFocus: () => any,
}

export const CourseSearchBar = (props: PropsType) => (
	<NativeSearchBar
		ref={props.getRef}
		hideBackground={true}
		onChangeText={props.onChangeText || null}
    onFocus={props.onFocus}
		onSearchButtonPress={props.onSearchButtonPress || null}
		placeholder={props.placeholder || 'Search'}
		style={styles.searchbar}
    textFieldBackgroundColor={c.sto.lightGray}
	/>
)
