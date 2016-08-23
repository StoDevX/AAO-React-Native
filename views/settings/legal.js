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
})

export default function LegalView() {
  return (
    <ScrollView style={styles.container}>
      <Text>{legal.content}</Text>
    </ScrollView>
  )
}
LegalView.propTypes = {}
