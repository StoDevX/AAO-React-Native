// @flow
import * as React from 'react'
import {StyleSheet, Platform} from 'react-native'
import BasicButton from 'react-native-button'
import noop from 'lodash/noop'
import {material, iOSUIKit} from 'react-native-typography'

import * as c from './colors'

const styles = StyleSheet.create({
  button: {
    backgroundColor: c.denim,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: c.iosLightBackground,
  },
  text: {
    ...Platform.select({
      ios: iOSUIKit.calloutWhiteObject,
      android: material.buttonWhiteObject,
    }),
  },
  textDisabled: {
    color: c.iosDisabledText,
  },
})

type Props = {
  title?: string,
  onPress?: () => any,
  disabled?: boolean,
}

export function Button({
  title = 'Push me!',
  onPress = noop,
  disabled = false,
}: Props) {
  return (
    <BasicButton
      containerStyle={styles.button}
      disabled={disabled}
      disabledContainerStyle={styles.disabled}
      onPress={onPress}
      style={styles.text}
      styleDisabled={styles.textDisabled}
    >
      {Platform.OS === 'android' ? title.toUpperCase() : title}
    </BasicButton>
  )
}
