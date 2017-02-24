// @flow
import React from 'react'
import {StyleSheet, Text} from 'react-native'
import {CustomCell} from 'react-native-tableview-simple'
import * as c from '../../components/colors'

const styles = StyleSheet.create({
  button: {
    justifyContent: 'flex-start',
  },
  text: {
    fontSize: 16,
  },
  active: {
    color: c.infoBlue,
  },
  disabled: {
    color: c.iosDisabledText,
  },
})

export function LoginButton({loading, disabled, loggedIn, onPress, label}: {loading: boolean, disabled?: boolean, loggedIn: boolean, onPress: () => any, label: string}) {
  let loginTextStyle = loading || disabled
    ? styles.disabled
    : styles.active

  return (
    <CustomCell
      contentContainerStyle={styles.button}
      isDisabled={loading || disabled}
      onPress={onPress}
    >
      <Text style={[styles.text, loginTextStyle]}>
        {loading
          ? `Logging in to ${label}…`
          : loggedIn
            ? `Sign Out of ${label}`
            : `Sign In to ${label}`}
      </Text>
    </CustomCell>
  )
}
