// @flow
import React from 'react'
import {
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native'
import credits from '../../data/credits.json'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
  aboutText: {
    marginBottom: 10,
  },
  nameList: {
    alignSelf: 'center',
  },
})

export default function CreditsView() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.aboutText}>{credits.content}</Text>
      <Text style={styles.nameList}>Contributers: {credits.contributers}</Text>
      <Text style={styles.nameList}>Acknowledgements: {credits.acknowledgements}</Text>
    </ScrollView>
  )
}
