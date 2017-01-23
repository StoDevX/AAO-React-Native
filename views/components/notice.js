// @flow
import React from 'react'
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native'
import {Button} from './button'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    textAlign: 'center',
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
})

export function NoticeView({text, style, spinner, buttonText, onPress}: {
  text: string,
  style?: any,
  spinner?: boolean,
  buttonText?: string,
  onPress?: () => any,
}) {
  let activityIndicator = spinner ? <ActivityIndicator style={styles.spinner} /> : null
  return (
    <View style={[styles.container, style]}>
      {activityIndicator}
      <Text style={styles.text}>
        {text || 'Notice!'}
      </Text>
      {buttonText ? <Button onPress={onPress} title={buttonText} /> : null}
    </View>
  )
}
