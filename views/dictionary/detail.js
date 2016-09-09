import React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'

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

export function DictionaryDetailView(props) {
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.term}>{props.item.word}</Text>
    <Text style={styles.definition}>{props.item.definition}</Text>
  </ScrollView>
}
DictionaryDetailView.propTypes = {
  item: React.PropTypes.shape({
    word: React.PropTypes.string.isRequired,
    definition: React.PropTypes.string.isRequired,
  }).isRequired,
}
