// @flow
import React from 'react'
import {
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native'
import legal from '../../data/legal.json'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
  legal: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 10,
    paddingBottom: 20,
    lineHeight: 20,
  },
})

export default function LegalView() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.legal}>{legal.content}</Text>
    </ScrollView>
  )
}
LegalView.propTypes = {}
