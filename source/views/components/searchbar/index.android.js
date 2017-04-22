// @flow
import React from 'react'
import {View} from 'react-native'
import SearchBar from 'react-native-searchbar'

export const Searchbar = ({children, ...props}: PropsType) => {
  return (
    <View {...props}>
      {children}
    </View>
  )
}
