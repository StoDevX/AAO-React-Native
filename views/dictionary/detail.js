import React from 'react'
import {ScrollView, Text} from 'react-native'

export function DictionaryDetailView(props) {
  return <ScrollView>
    <Text>{props.item.word}</Text>
    <Text>{props.item.definition}</Text>
  </ScrollView>
}
DictionaryDetailView.propTypes = {
  item: React.PropTypes.shape({
    word: React.PropTypes.string.isRequired,
    definition: React.PropTypes.string.isRequired,
  }).isRequired,
}
