/**
 * All About Olaf
 * Dictionary page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
} from 'react-native'

import CollapsibleRow from '../components/collapsibleRow'

import terms from '../../data/dictionary.json'

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default class DictionaryView extends React.Component {
  constructor(props) {
    super(props)
    let ds = new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    })
    this.state = {
      dataSource: ds.cloneWithRows(terms),
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.word !== r2.word
  }

  _renderRow(data) {
    return (
      <CollapsibleRow header={data.word} content={data.definition} subheaderText='' />
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)} />
      </View>
    )
  }
}
