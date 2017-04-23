// @flow
import React from 'react'
import MaterialSearchBar from 'react-native-material-design-searchbar'

type PropsType = {
  placeholder?: string,
  onChangeText: string => any,
}

export const SearchBar = (props: PropsType) => (
  <MaterialSearchBar
    height={40}
    placeholder={props.placeholder || 'Search'}
    onSearchChange={props.onChangeText || null}
  />
)
