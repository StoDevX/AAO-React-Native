// @flow
import React from 'react'

import {
    StyleSheet,
    Text,
    View,
} from 'react-native'

export default function LoadingView({text='Loading…'}: {text?: string}) {
  return (
    <View style={styles.container}>
      <Text>
        {text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
})
