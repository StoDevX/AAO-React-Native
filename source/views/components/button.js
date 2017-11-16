// @flow
import * as React from 'react'
import {StyleSheet} from 'react-native'
import BasicButton from 'react-native-button'
import noop from 'lodash/noop'

import * as c from './colors'

const styles = StyleSheet.create({
  button: {
    backgroundColor: c.denim,
    color: c.white,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: c.iosLightBackground,
    color: c.iosDisabledText,
  },
})

export function Button({
  title,
  onPress = noop,
  disabled = false,
}: {
  title?: string,
  onPress?: () => any,
  disabled?: boolean,
}) {
  return (
    <BasicButton
      onPress={disabled ? noop : onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      {title || 'Push me!'}
    </BasicButton>
  )
}
