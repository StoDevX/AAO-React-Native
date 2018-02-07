// @flow

import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

type Props = {
  onPress: () => any,
}

export function MenuButton({onPress} : Props) {

  return (
    <TouchableOpacity onPress={onPress}>
      <Icon name='ios-more' size={28} style={styles.icon} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  icon: {
    padding: 10,
    color: 'white',
  }
})
