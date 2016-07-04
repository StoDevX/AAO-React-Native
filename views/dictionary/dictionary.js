/**
 * All About Olaf
 * Dictionary page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView,
  TouchableOpacity,
  Navigator,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import terms from '../../data/dictionary.json'

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

  pushView(view, viewTitle) {
    this.props.navigator.push({
      id: view,
      title: viewTitle,
      sceneConfig: Navigator.SceneConfigs.FloatFromRight,
    });
  }

  _renderRow(data) {
    return (
      <TouchableOpacity
        key={data.word}
        onPress={this.pushView('DictionaryPageView', data.word)}
      >
        <View style={styles.row}>
          <Text style={styles.label}>{data.word}</Text>
        </View>
      </TouchableOpacity>
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
