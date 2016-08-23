// @flow
import React from 'react'
import {
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native'
import privacy from '../../data/privacy.json'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
})

export default function PrivacyView() {
  return (
    <ScrollView style={styles.container}>
      <Text>{privacy.text}</Text>
    </ScrollView>
  )
}
