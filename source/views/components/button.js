// @flow
import React from 'react'
import {StyleSheet} from 'react-native'
import BasicButton from 'react-native-button'
import noop from 'lodash/noop'

import * as c from './colors'

const styles = StyleSheet.create({
  button: {
    backgroundColor: c.denim,
    width: 200,
    color: c.white,
    alignSelf: 'center',
    paddingVertical: 10,
    marginVertical: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
})

export function Button({title, onPress}: {
  title?: string,
  onPress?: () => {},
}) {
  return (
    <BasicButton
      onPress={onPress || noop}
      style={styles.button}
    >
      {title || 'Push me!'}
    </BasicButton>
  )
}
