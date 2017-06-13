// @flow
import React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import type {WordType} from './types'

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  term: {
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 10,
  },
  definition: {},
})

export function DictionaryDetailView(props: {item: WordType}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text selectable={true} style={styles.term}>{props.item.word}</Text>
      <Text selectable={true} style={styles.definition}>
        {props.item.definition}
      </Text>
    </ScrollView>
  )
}
