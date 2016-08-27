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
    paddingBottom: 10,
  },
  privacy: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 10,
    lineHeight: 20,
  },
})

export default function PrivacyView() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.privacy}>{privacy.text}</Text>
    </ScrollView>
  )
}
