/**
 * All About Olaf
 * iOS Dictionary page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'
import terms from '../data/dictionary.json'

export default class DictionaryView extends React.Component {
  constructor() {
    super()
    let ds = new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    })
    this.state = {
      dataSource: ds.cloneWithRows(terms)
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.word !== r2.word && r1.definition !== r2.definition
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="Dictionary"
      renderScene={this.renderScene.bind(this)}
    />
  }

  _renderRow(data) {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{data.word}</Text>
      </View>
    )
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)}
        />
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    marginTop: 5,
    marginBottom: 5,
  },
  label: {},
})
