// @flow

import React from 'react'
import {View} from 'react-native'

export const Searchbar = ({children, ...props}: PropsType) => {
  return (
    <View {...props}>
      {children}
    </View>
  )
}
