// @flow

import * as React from 'react'
import {StyleSheet, Component} from 'react-native'
import * as c from '../../../components/colors'
import SearchBar from 'react-native-material-design-searchbar'

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
}


export const CourseSearchBar = (props: PropsType) => (
  <SearchBar
    onSearchChange={props.onChangeText || null}
    height={50}
    onFocus={() => console.log('On Focus')}
    onBlur={() => console.log('On Blur')}
    placeholder={props.placeholder || 'Search'}
    autoCorrect={false}
    padding={5}
    returnKeyType={'search'}
    style={styles.searchbar}
  />
)
