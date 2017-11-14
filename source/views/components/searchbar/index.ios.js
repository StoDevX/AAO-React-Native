// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import NativeSearchBar from '@hawkrives/react-native-search-bar'
import * as c from '../colors'

const styles = StyleSheet.create({
  searchbar: {
    backgroundColor: c.iosGray,
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

export const SearchBar = (props: PropsType) => (
  <NativeSearchBar
    ref={props.getRef}
    style={styles.searchbar}
    hideBackground={true}
    placeholder={props.placeholder || 'Search'}
    onChangeText={props.onChangeText || null}
    onSearchButtonPress={props.onSearchButtonPress || null}
  />
)
