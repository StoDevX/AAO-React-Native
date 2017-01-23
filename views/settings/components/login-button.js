// @flow
import React from 'react'
import {StyleSheet, Text} from 'react-native'
import {CustomCell} from 'react-native-tableview-simple'
import * as c from '../../components/colors'

const styles = StyleSheet.create({
  actionButton: {
    justifyContent: 'flex-start',
  },
  loginButtonText: {
    fontSize: 16,
  },
  loginButtonTextActive: {
    color: c.infoBlue,
  },
  loginButtonTextDisabled: {
    color: c.iosDisabledText,
  },
})

export function LoginButton({loading, loggedIn, onPress, label}: {loading: boolean, loggedIn: boolean, onPress: () => any, label: string}) {
  let loginTextStyle = loading
    ? styles.loginButtonTextDisabled
    : styles.loginButtonTextActive

  return (
    <CustomCell
      contentContainerStyle={styles.actionButton}
      isDisabled={loading}
      onPress={onPress}
    >
      <Text style={[styles.loginButtonText, loginTextStyle]}>
        {loading
          ? `Logging in to ${label}…`
          : loggedIn
            ? `Sign Out of ${label}`
            : `Sign In to ${label}`}
      </Text>
    </CustomCell>
  )
}
